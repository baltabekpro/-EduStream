import type { VercelRequest, VercelResponse } from '@vercel/node';

const DEFAULT_BACKEND = 'https://172-207-57-215.sslip.io';

function getBackendBaseUrl() {
  const configured =
    process.env.BACKEND_URL ||
    process.env.API_BASE_URL ||
    process.env.VITE_API_BASE_URL ||
    DEFAULT_BACKEND;

  return configured.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
}

function appendQueryParam(params: URLSearchParams, key: string, value: string | string[]) {
  if (Array.isArray(value)) {
    value.forEach((item) => params.append(key, item));
  } else {
    params.append(key, value);
  }
}

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // proxyPath is passed from vercel.json rewrite
  const proxyPath = req.query.proxyPath || '';

  // Reconstruct query string without proxyPath
  const qsParams = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'proxyPath' || value === undefined) continue;
    appendQueryParam(qsParams, key, value);
  }
  const qs = qsParams.toString();

  const backend = getBackendBaseUrl();
  const normalizedProxyPath = Array.isArray(proxyPath) ? proxyPath.join('/') : proxyPath;
  const targetUrl = `${backend}/api/v1/${normalizedProxyPath}${qs ? `?${qs}` : ''}`;

  const HOP_BY_HOP = new Set([
    'host', 'connection', 'keep-alive', 'transfer-encoding',
    'te', 'upgrade', 'proxy-authorization', 'proxy-authenticate',
  ]);

  const forwardHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(req.headers)) {
    const lk = k.toLowerCase();
    if (HOP_BY_HOP.has(lk)) continue;
    if (typeof v === 'string') forwardHeaders[k] = v;
    else if (Array.isArray(v)) forwardHeaders[k] = v.join(', ');
  }

  // Collect raw body (needed for multipart file uploads and JSON POSTs)
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve) => {
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', resolve);
  });
  const bodyBuf = chunks.length ? Buffer.concat(chunks) : null;

  console.log(`[proxy] ${req.method} ${targetUrl} body=${bodyBuf?.length ?? 0}B`);

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method ?? 'GET',
      headers: forwardHeaders,
      ...(bodyBuf && bodyBuf.length > 0
        ? { body: bodyBuf, duplex: 'half' as never }
        : {}),
    });

    res.status(upstream.status);
    upstream.headers.forEach((v, k) => {
      if (k.startsWith('access-control-')) return;
      res.setHeader(k, v);
    });

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.end(buf);
    console.log(`[proxy] ← ${upstream.status} ${buf.length}B`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[proxy] error:', msg, '→', targetUrl);
    if (!res.headersSent) {
      res.status(502).json({ detail: 'Bad Gateway', error: msg });
    }
  }
}

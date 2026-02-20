// Disable TLS cert verification for the self-signed cert on the backend.
// This runs only inside Vercel's isolated serverless container — safe.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(process.env as any)['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

import type { VercelRequest, VercelResponse } from '@vercel/node';

const BACKEND = 'https://94.131.85.176';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // [...]path catch-all: req.query.path is string[] for /auth/login → ['auth','login']
  const segments = req.query.path;
  const pathParts = Array.isArray(segments)
    ? segments
    : segments
    ? [segments]
    : [];

  const qs = (req.url ?? '').split('?')[1];
  const targetUrl = `${BACKEND}/api/v1/${pathParts.join('/')}${qs ? `?${qs}` : ''}`;

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

// Disable TLS cert verification for the self-signed cert on the backend.
// Safe: this runs only inside Vercel's isolated serverless container.
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
    if (!HOP_BY_HOP.has(k.toLowerCase()) && typeof v === 'string') {
      forwardHeaders[k] = v;
    } else if (Array.isArray(v)) {
      forwardHeaders[k] = v.join(', ');
    }
  }

  // Collect body
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve) => {
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', resolve);
  });
  const body = chunks.length ? Buffer.concat(chunks) : undefined;

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method ?? 'GET',
      headers: forwardHeaders,
      body: body?.length ? body : undefined,
      // @ts-ignore - Node 18+ fetch
      duplex: 'half',
    });

    res.status(upstream.status);
    upstream.headers.forEach((v, k) => {
      if (!k.startsWith('access-control-')) res.setHeader(k, v);
    });

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.end(buf);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[proxy] error:', msg, 'target:', targetUrl);
    if (!res.headersSent) {
      res.status(502).json({ detail: 'Bad Gateway', error: msg });
    }
  }
}

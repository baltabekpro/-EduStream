import type { VercelRequest, VercelResponse } from '@vercel/node';
import https from 'https';

// Vercel serverless proxy — forwards /api/v1/* to the backend.
// SSL verification is disabled because the origin uses a self-signed cert.
// This is a server-to-server connection inside Vercel's network — safe.
const BACKEND_ORIGIN = 'https://94.131.85.176';
const agent = new https.Agent({ rejectUnauthorized: false });

export const config = {
  api: {
    bodyParser: false,       // keep raw body for file uploads / JSON
    externalResolver: true,
  },
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  // [...]path catch-all: req.query.path is string[] for /api/v1/a/b/c → ['a','b','c']
  const segments = req.query.path;
  const pathParts = Array.isArray(segments)
    ? segments
    : segments
    ? [segments]
    : [];

  const qs = (req.url ?? '').split('?')[1];
  const targetUrl =
    `${BACKEND_ORIGIN}/api/v1/${pathParts.join('/')}` +
    (qs ? `?${qs}` : '');

  const HOP_BY_HOP = new Set([
    'host', 'connection', 'keep-alive', 'transfer-encoding',
    'te', 'upgrade', 'proxy-authorization', 'proxy-authenticate',
  ]);

  const forwardHeaders: Record<string, string | string[]> = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (!HOP_BY_HOP.has(k.toLowerCase()) && v !== undefined) {
      forwardHeaders[k] = v;
    }
  }

  const proxyReq = https.request(
    targetUrl,
    {
      method: req.method ?? 'GET',
      headers: forwardHeaders,
      agent,
    },
    (proxyRes) => {
      res.status(proxyRes.statusCode ?? 502);

      for (const [k, v] of Object.entries(proxyRes.headers)) {
        if (k.toLowerCase().startsWith('access-control-')) continue;
        if (v !== undefined) res.setHeader(k, v);
      }

      proxyRes.pipe(res, { end: true });
    },
  );

  proxyReq.on('error', (err) => {
    console.error('[proxy] upstream error:', err.message, 'target:', targetUrl);
    if (!res.headersSent) {
      res.status(502).json({ detail: 'Bad Gateway', error: err.message });
    }
  });

  req.pipe(proxyReq, { end: true });
}

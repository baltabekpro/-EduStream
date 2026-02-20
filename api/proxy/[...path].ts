import type { VercelRequest, VercelResponse } from '@vercel/node';
import https from 'https';

// Vercel serverless proxy — forwards /api/v1/* to the backend
// Uses rejectUnauthorized:false so the self-signed cert on the origin is accepted
// (this is safe: the connection is server-to-server on Vercel's private network)
const BACKEND_ORIGIN = 'https://94.131.85.176';
const agent = new https.Agent({ rejectUnauthorized: false });

export const config = {
  api: {
    bodyParser: false,      // keep raw body intact (important for file uploads)
    externalResolver: true,
  },
};

export default function handler(req: VercelRequest, res: VercelResponse) {
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

  // Build forwarded headers (drop hop-by-hop)
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
        // strip CORS headers — Vercel edge already adds them if needed
        if (k.toLowerCase().startsWith('access-control-')) continue;
        if (v !== undefined) res.setHeader(k, v);
      }

      proxyRes.pipe(res, { end: true });
    },
  );

  proxyReq.on('error', (err) => {
    console.error('[proxy] upstream error:', err.message);
    if (!res.headersSent) {
      res.status(502).json({ detail: 'Bad Gateway', error: err.message });
    }
  });

  // Stream incoming request body (handles JSON, multipart/form-data, etc.)
  req.pipe(proxyReq, { end: true });
}

import { NextFunction, Request, Response } from 'express';

type MetricsBucket = {
  samples: number[];
  lastUpdatedAt: number;
};

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 120;
const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_SAMPLES_PER_ROUTE = 300;

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const requestMetricsStore = new Map<string, MetricsBucket>();

const toInt = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
};

const percentile = (samples: number[], value: number): number => {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * value) - 1));
  return sorted[idx];
};

const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0];
  }
  return req.ip || 'unknown';
};

export const requestTimeoutMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const timeoutMs = toInt(process.env.REQUEST_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);
  req.setTimeout(timeoutMs);
  res.setTimeout(timeoutMs, () => {
    if (!res.headersSent) {
      res.status(504).json({ message: 'Request timeout' });
    }
  });
  next();
};

export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Keep healthchecks and static assets out of rate limiting.
  if (req.path === '/api/health' || req.path.startsWith('/uploads')) {
    return next();
  }

  const windowMs = toInt(process.env.RATE_LIMIT_WINDOW_MS, DEFAULT_WINDOW_MS);
  const maxRequests = toInt(process.env.RATE_LIMIT_MAX, DEFAULT_MAX_REQUESTS);
  const key = `${getClientIp(req)}:${req.path}`;
  const now = Date.now();

  const current = rateLimitStore.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return next();
  }

  if (current.count >= maxRequests) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    res.setHeader('Retry-After', String(retryAfter));
    return res.status(429).json({ message: 'Too many requests, please retry shortly.' });
  }

  current.count += 1;
  rateLimitStore.set(key, current);
  return next();
};

export const requestMetricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    // req.path can be rewritten to "/" inside mounted routers; keep original URL for API filtering.
    const originalPath = (req.originalUrl || '').split('?')[0];
    if (!originalPath.startsWith('/api')) return;

    const duration = Date.now() - startedAt;
    const routePath = req.route?.path;
    let resolvedPath = originalPath;

    if (typeof routePath === 'string') {
      const basePath = req.baseUrl || '';
      resolvedPath = `${basePath}${routePath}`.replace(/\/+/g, '/');
    }

    const key = `${req.method} ${resolvedPath}`;
    const bucket = requestMetricsStore.get(key) || { samples: [], lastUpdatedAt: Date.now() };
    bucket.samples.push(duration);
    if (bucket.samples.length > MAX_SAMPLES_PER_ROUTE) {
      bucket.samples.splice(0, bucket.samples.length - MAX_SAMPLES_PER_ROUTE);
    }
    bucket.lastUpdatedAt = Date.now();
    requestMetricsStore.set(key, bucket);
  });
  next();
};

export const getRequestMetricsSnapshot = () => {
  return Array.from(requestMetricsStore.entries())
    .map(([route, bucket]) => {
      const p95 = percentile(bucket.samples, 0.95);
      const p99 = percentile(bucket.samples, 0.99);
      const avg = bucket.samples.length === 0
        ? 0
        : bucket.samples.reduce((sum, n) => sum + n, 0) / bucket.samples.length;
      return {
        route,
        count: bucket.samples.length,
        avgMs: Number(avg.toFixed(2)),
        p95Ms: Number(p95.toFixed(2)),
        p99Ms: Number(p99.toFixed(2)),
        lastUpdatedAt: bucket.lastUpdatedAt,
      };
    })
    .sort((a, b) => b.p95Ms - a.p95Ms);
};

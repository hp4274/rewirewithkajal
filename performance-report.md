# Performance Report

Date: 2026-03-10
Scope: frontend + backend optimization validation and post-fix telemetry verification

## 1) Lighthouse (Home/Admin)

Baseline artifacts:
- `lighthouse-home.json`
- `lighthouse-admin.json`

Post-optimization artifacts used for final comparison:
- `frontend/lighthouse-home-after.json`
- `frontend/lighthouse-admin-after.json`

| Page | Perf Score | LCP (s) | CLS | TBT (ms) | INP (lab) |
|---|---:|---:|---:|---:|---:|
| Home (baseline) | 63 | 6.94 | 0.000 | 209 | 0 |
| Home (after) | 72 | 5.05 | 0.001 | 343 | 0 |
| Admin Login (baseline) | 78 | 3.56 | 0.000 | 232 | 0 |
| Admin Login (after) | 91 | 2.94 | 0.000 | 11 | 0 |

Notes:
- Admin page improved strongly (score, LCP, TBT).
- Home page improved in score and LCP, with low CLS maintained.
- Home TBT increased in this run; home JS execution remains a follow-up target.

## 2) API Latency Percentiles (latest clean local run)

Measurement script:
- `backend/scripts/benchmark_api.ps1`

Results (20 requests/endpoint):

| Endpoint | Avg (ms) | p95 (ms) | p99 (ms) | HTTP status profile |
|---|---:|---:|---:|---|
| GET /api/customers | 22.98 | 31.02 | 217.38 | 200:20 |
| GET /api/blogs | 8.74 | 12.82 | 13.41 | 200:20 |
| GET /api/admin/turnover | 9.54 | 11.54 | 15.53 | 200:20 |
| GET /api/leads | 6.88 | 9.29 | 11.02 | 200:20 |
| GET /api/health | 4.15 | 5.61 | 7.90 | 200:20 |
| GET /api/blogs/public | 3.62 | 5.51 | 6.97 | 200:20 |
| GET /api/admin/historical-forms | 4.08 | 5.42 | 6.30 | 400:20 |

Notes:
- `/api/customers` remains the slowest observed route by p95.
- `/api/admin/historical-forms` requires `phone` + `dob`; this benchmark intentionally hit it without secure-match params, so it returned fast `400` responses and is excluded from meaningful latency ranking.

## 3) Runtime Telemetry Validation

Endpoint:
- `GET /api/health/perf`

Fix applied:
- In `backend/src/middleware/performanceMiddleware.ts`, route telemetry now uses `req.originalUrl`/`req.baseUrl + req.route.path` instead of `req.path` in `res.on('finish')`.
- This resolves missing metrics for mounted routers (where `req.path` can be rewritten to `/`).

Top routes from current perf snapshot:
- `POST /api/auth/register` (count=2, p95=203)
- `GET /api/customers/` (count=40, p95=16, p99=217)
- `GET /api/admin/turnover` (count=41, p95=12)
- `GET /api/blogs/` (count=40, p95=9)
- `GET /api/leads/` (count=40, p95=8)
- `GET /api/blogs/public` (count=45, p95=6)

## 4) Heaviest Frontend Assets

Top 5 deployed build assets (excluding source maps):
1. `frontend/build/static/js/412.40561c69.chunk.js` - 257930 bytes
2. `frontend/build/static/js/main.f4ca4d23.js` - 244503 bytes
3. `frontend/build/static/js/388.fd2d69b8.chunk.js` - 63041 bytes
4. `frontend/build/static/media/logo3.44e7ad3d6f4816071fc4.png` - 62300 bytes
5. `frontend/build/favicon.png` - 62300 bytes

Largest source image files still present:
1. `frontend/src/assets/image2.png` - 8688809 bytes
2. `frontend/src/assets/image1.png` - 8271627 bytes
3. `frontend/src/assets/anxity.png` - 6923717 bytes
4. `frontend/src/assets/lady.png` - 2340489 bytes
5. `frontend/src/assets/image3.png` - 71449 bytes

## 5) Remaining Optimization Backlog

1. Convert oversized source PNGs to WebP/AVIF and replace/remove unused originals.
2. Reduce Home main-thread work (TBT regression) by further splitting/deprioritizing non-critical JS.
3. Add monitoring/alerting (Sentry/APM + endpoint latency alarms).
4. Add benchmark variant for secure-match historical forms using real `phone` + `dob` sample.

## 6) 2026-03-10 Additional Optimization Pass

Implemented in this pass:
- Backend guardrail: DB session safety limits on connect (`statement_timeout`, `lock_timeout`, `idle_in_transaction_session_timeout`) in `backend/src/db.ts`.
- Frontend loading: deferred below-the-fold home sections via intersection-triggered mounting in `frontend/src/pages/Home.tsx`.
- Frontend route shell: avoid rendering/loading decorative non-admin components (`Preloader`, `AnimatedBackground`, `Footer`) on admin routes in `frontend/src/App.tsx`.
- Edge/static headers: expanded caching policy coverage for uploads/media/html in `vercel.json`.

### Lighthouse delta (fresh baseline -> after this pass)

Artifacts:
- Baseline: `lighthouse-home-baseline-20260310.json`, `lighthouse-admin-baseline-20260310.json`
- After: `lighthouse-home-after-20260310-v2.json`, `lighthouse-admin-after-20260310-v2.json`

| Page | Perf Score | LCP (s) | CLS | TBT (ms) |
|---|---:|---:|---:|---:|
| Home (baseline) | 95 | 1.38 | 0.000 | 8 |
| Home (after) | 97 | 0.93 | 0.001 | 16 |
| Admin Login (baseline) | 100 | 0.80 | 0.000 | 0 |
| Admin Login (after) | 100 | 0.80 | 0.000 | 0 |

Observations:
- Home improved in score (+2) and LCP (-0.45s).
- Home TBT rose slightly (+8ms) but remains very low in absolute terms.
- Admin stayed at top score and stable timing.

### API percentile rerun (same script, 20 requests/endpoint)

Measurement script:
- `backend/scripts/benchmark_api.js`

| Endpoint | Pre Avg/p95/p99 (ms) | Post Avg/p95/p99 (ms) | Status (post) |
|---|---|---|---|
| GET /api/customers | 23.10 / 24.15 / 115.09 | 26.94 / 30.74 / 200.94 | 200:20 |
| GET /api/blogs | 13.04 / 16.68 / 17.94 | 13.91 / 21.13 / 22.25 | 200:20 |
| GET /api/admin/turnover | 11.04 / 16.57 / 26.14 | 15.23 / 16.16 / 119.38 | 200:20 |
| GET /api/leads | 12.88 / 26.78 / 27.93 | 14.25 / 22.65 / 43.01 | 200:20 |
| GET /api/health | 7.45 / 10.25 / 11.08 | 7.80 / 11.65 / 13.00 | 200:20 |
| GET /api/blogs/public | 10.43 / 14.16 / 39.38 | 10.29 / 18.37 / 32.49 | 200:20 |
| GET /api/admin/historical-forms | 5.48 / 7.40 / 9.39 | 5.49 / 8.38 / 8.63 | 400:20 |

Notes on API deltas:
- Local-run variability remains visible (especially p99 spikes), so treat this as directional.
- Historical-forms is still a fast 400-path benchmark until valid `phone` + `dob` parameters are provided.

### Bundle snapshot after rebuild

Top JS files (raw bytes, non-map focus):
1. `frontend/build/static/js/412.40561c69.chunk.js` - 257930
2. `frontend/build/static/js/main.9a8056d6.js` - 244559
3. `frontend/build/static/js/388.fd2d69b8.chunk.js` - 63041
4. `frontend/build/static/js/722.c1354ec3.chunk.js` - 40004
5. `frontend/build/static/js/477.8ee8950a.chunk.js` - 14646

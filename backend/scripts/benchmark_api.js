const { performance } = require('node:perf_hooks');

const BASE = 'http://localhost:5000';

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1);
  return sorted[idx];
}

async function timedFetch(url, token) {
  const start = performance.now();
  let status = 0;
  try {
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    status = res.status;
    await res.arrayBuffer();
  } catch {
    status = -1;
  }
  const ms = performance.now() - start;
  return { ms, status };
}

async function main() {
  const adminEmail = `perf-admin-${Math.floor(Math.random() * 900000 + 100000)}@example.com`;
  const reg = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail }),
  });

  if (!reg.ok) {
    const body = await reg.text();
    throw new Error(`register failed (${reg.status}): ${body}`);
  }

  const regBody = await reg.json();
  const token = regBody.token;

  const targets = [
    { name: 'GET /api/health', url: `${BASE}/api/health`, auth: false },
    { name: 'GET /api/blogs/public', url: `${BASE}/api/blogs/public?limit=20&page=1`, auth: false },
    { name: 'GET /api/blogs', url: `${BASE}/api/blogs?limit=100&page=1`, auth: true },
    { name: 'GET /api/customers', url: `${BASE}/api/customers?limit=100&page=1`, auth: true },
    { name: 'GET /api/leads', url: `${BASE}/api/leads?limit=100&page=1&sortBy=created_at&order=DESC`, auth: true },
    { name: 'GET /api/admin/turnover', url: `${BASE}/api/admin/turnover`, auth: true },
    { name: 'GET /api/admin/historical-forms', url: `${BASE}/api/admin/historical-forms?limit=100&page=1`, auth: true },
  ];

  const iterations = 20;
  const summary = [];

  for (const t of targets) {
    const samples = [];
    for (let i = 0; i < iterations; i += 1) {
      samples.push(await timedFetch(t.url, t.auth ? token : null));
      await new Promise((r) => setTimeout(r, 80));
    }

    const values = samples.map((s) => s.ms).sort((a, b) => a - b);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const statuses = samples.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {});

    summary.push({
      name: t.name,
      avgMs: Number(avg.toFixed(2)),
      p95Ms: Number(percentile(values, 0.95).toFixed(2)),
      p99Ms: Number(percentile(values, 0.99).toFixed(2)),
      statuses,
    });
  }

  // Add a little fresh traffic before reading perf health snapshot.
  for (let i = 0; i < 5; i += 1) {
    await timedFetch(`${BASE}/api/health`, null);
    await timedFetch(`${BASE}/api/blogs/public?limit=10&page=1`, null);
  }

  const perfRes = await fetch(`${BASE}/api/health/perf`);
  const perf = await perfRes.json();

  console.log('API BENCHMARK RESULTS');
  summary
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((r) => {
      const statusLine = Object.entries(r.statuses)
        .map(([k, v]) => `${k}:${v}`)
        .join(',');
      console.log(`${r.name} | avg=${r.avgMs} p95=${r.p95Ms} p99=${r.p99Ms} statuses=${statusLine}`);
    });

  console.log('PERF SNAPSHOT TOP ROUTES');
  (perf.routes || [])
    .sort((a, b) => b.p95Ms - a.p95Ms)
    .slice(0, 8)
    .forEach((r) => {
      console.log(`${r.route} | count=${r.count} avg=${r.avgMs} p95=${r.p95Ms} p99=${r.p99Ms}`);
    });
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

import { Client, Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const sslConfig = process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false };

const createPool = (config: PoolConfig) => {
  const nextPool = new Pool(config);
  nextPool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });
  return nextPool;
};

const commonPoolOptions: PoolConfig = {
  max: parseInt(process.env.DB_POOL_MAX || (process.env.VERCEL ? '5' : '20'), 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '10000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT_MS || '5000', 10),
  keepAlive: true,
};

const slowQueryThresholdMs = parseInt(process.env.DB_SLOW_QUERY_MS || '0', 10);

const formatQueryPreview = (text: unknown): string => {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  return normalized.length > 180 ? `${normalized.slice(0, 180)}...` : normalized;
};

const logSlowQueryIfNeeded = (startedAt: number, args: any[]) => {
  if (!Number.isFinite(slowQueryThresholdMs) || slowQueryThresholdMs <= 0) return;
  const duration = Date.now() - startedAt;
  if (duration < slowQueryThresholdMs) return;
  const queryText = typeof args?.[0] === 'string' ? args[0] : args?.[0]?.text;
  console.warn(`[db][slow-query] ${duration}ms ${formatQueryPreview(queryText)}`);
};

const basePoolConfig: PoolConfig = connectionString
  ? {
      connectionString,
      // Supabase requires SSL in hosted environments.
      ssl: sslConfig,
      ...commonPoolOptions,
    }
  : {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'rewire_kajal',
      password: process.env.DB_PASSWORD || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      ...commonPoolOptions,
    };

let activePool = createPool(basePoolConfig);
let fallbackAttempted = false;
let fallbackInFlight: Promise<boolean> | null = null;

const isNotFoundError = (err: unknown): boolean => {
  const maybe = err as { code?: string; message?: string };
  return maybe?.code === 'ENOTFOUND' || (maybe?.message || '').includes('ENOTFOUND');
};

const extractSupabaseProjectRef = (urlString: string): string | null => {
  try {
    const parsed = new URL(urlString);
    const match = parsed.hostname.match(/^db\.([a-z0-9]{20})\.supabase\.co$/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

const buildCandidateUrl = (original: URL, host: string, user: string, port: string): string => {
  const next = new URL(original.toString());
  next.hostname = host;
  next.username = user;
  next.port = port;
  return next.toString();
};

const testConnectionString = async (candidate: string): Promise<{ ok: boolean; authFailed: boolean }> => {
  const client = new Client({
    connectionString: candidate,
    ssl: sslConfig,
    connectionTimeoutMillis: 3000,
  });

  try {
    await client.connect();
    await client.query('SELECT 1');
    return { ok: true, authFailed: false };
  } catch (err) {
    const msg = (err as { message?: string })?.message || '';
    return { ok: false, authFailed: msg.includes('password authentication failed') };
  } finally {
    try {
      await client.end();
    } catch {
      // ignore
    }
  }
};

const findSupabasePoolerConnectionString = async (directConnectionString: string): Promise<string | null> => {
  const ref = extractSupabaseProjectRef(directConnectionString);
  if (!ref) return null;

  let parsedOriginal: URL;
  try {
    parsedOriginal = new URL(directConnectionString);
  } catch {
    return null;
  }

  const originalUser = parsedOriginal.username || 'postgres';
  const preferredRegions = ['ap-south-1', 'us-east-1', 'eu-west-1', 'eu-central-1', 'us-west-1', 'ap-southeast-1'];
  const allRegions = [
    'af-south-1',
    'ap-east-1',
    'ap-south-1',
    'ap-south-2',
    'ap-southeast-1',
    'ap-southeast-2',
    'ap-southeast-3',
    'ap-southeast-4',
    'ap-northeast-1',
    'ap-northeast-2',
    'ap-northeast-3',
    'ca-central-1',
    'eu-central-1',
    'eu-central-2',
    'eu-west-1',
    'eu-west-2',
    'eu-west-3',
    'eu-north-1',
    'eu-south-1',
    'me-central-1',
    'me-south-1',
    'sa-east-1',
    'us-east-1',
    'us-east-2',
    'us-west-1',
    'us-west-2',
  ];
  const regions = Array.from(new Set([...preferredRegions, ...allRegions]));
  const prefixes = ['aws-1', 'aws-0', 'aws-2'];

  let authFailureCandidate: string | null = null;

  for (const prefix of prefixes) {
    for (const region of regions) {
      const host = `${prefix}-${region}.pooler.supabase.com`;
      const candidates = [
        buildCandidateUrl(parsedOriginal, host, `postgres.${ref}`, '6543'),
        buildCandidateUrl(parsedOriginal, host, `postgres.${ref}`, '5432'),
        buildCandidateUrl(parsedOriginal, host, originalUser, '6543'),
        buildCandidateUrl(parsedOriginal, host, originalUser, '5432'),
      ];

      for (const candidate of candidates) {
        const result = await testConnectionString(candidate);
        if (result.ok) return candidate;
        if (result.authFailed && !authFailureCandidate) {
          authFailureCandidate = candidate;
        }
      }
    }
  }

  return authFailureCandidate;
};

const switchToPoolConfig = (config: PoolConfig) => {
  const previousPool = activePool;
  activePool = createPool(config);
  void previousPool.end().catch(() => {
    // ignore pool close errors during failover
  });
};

const trySupabaseFallback = async (err: unknown): Promise<boolean> => {
  if (!connectionString || fallbackAttempted || !isNotFoundError(err)) {
    return false;
  }

  if (fallbackInFlight) {
    return fallbackInFlight;
  }

  fallbackInFlight = (async () => {
    fallbackAttempted = true;
    const fallbackConnectionString = await findSupabasePoolerConnectionString(connectionString);
    if (!fallbackConnectionString) {
      return false;
    }

    console.warn('Direct Supabase host unresolved, switching to a pooler endpoint fallback.');
    switchToPoolConfig({
      connectionString: fallbackConnectionString,
      ssl: sslConfig,
      ...commonPoolOptions,
    });
    return true;
  })();

  try {
    return await fallbackInFlight;
  } finally {
    fallbackInFlight = null;
  }
};

const queryWithFallback: Pool['query'] = async (...args: any[]) => {
  const startedAt = Date.now();
  try {
    const result = await (activePool.query as any)(...args);
    logSlowQueryIfNeeded(startedAt, args);
    return result;
  } catch (err) {
    const switched = await trySupabaseFallback(err);
    if (!switched) {
      throw err;
    }
    const result = await (activePool.query as any)(...args);
    logSlowQueryIfNeeded(startedAt, args);
    return result;
  }
};

const connectWithFallback: Pool['connect'] = async (...args: any[]) => {
  try {
    return await (activePool.connect as any)(...args);
  } catch (err) {
    const switched = await trySupabaseFallback(err);
    if (!switched) {
      throw err;
    }
    return (activePool.connect as any)(...args);
  }
};

const pool = new Proxy({} as Pool, {
  get(_target, prop: keyof Pool) {
    if (prop === 'query') {
      return queryWithFallback;
    }
    if (prop === 'connect') {
      return connectWithFallback;
    }
    const value = (activePool as any)[prop];
    return typeof value === 'function' ? value.bind(activePool) : value;
  },
});

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  const res = await queryWithFallback(text, params as any);
  const duration = Date.now() - start;
  console.log('executed query', { text, duration, rows: res.rowCount });
  return res;
};

export default pool;

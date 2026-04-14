import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

const configuredApiBase = (process.env.REACT_APP_API_BASE_URL || '').trim().replace(/\/+$/, '');
const localFallbackApiBase = (process.env.REACT_APP_LOCAL_API_FALLBACK || 'http://localhost:5000').trim().replace(/\/+$/, '');

const isAbsoluteUrl = (value: string): boolean => /^https?:\/\//i.test(value);

const normalizeApiPath = (path: string): string => {
    if (!path) return '/';
    return path.startsWith('/') ? path : `/${path}`;
};

const isLocalHost = (): boolean => {
    if (typeof window === 'undefined') return false;
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1';
};

const shouldRetryWithLocalFallback = (error: any): boolean => {
    if (!isLocalHost()) return false;
    if (configuredApiBase) return false;

    const status = Number(error?.response?.status || 0);
    if (![404, 502, 503].includes(status)) return false;

    const url = String(error?.config?.url || '');
    return url.includes('/api/');
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetryTransient = (error: any): boolean => {
    const status = Number(error?.response?.status || 0);
    const networkError = !error?.response;
    return networkError || status === 429 || status === 502 || status === 503 || status === 504;
};

export const apiUrl = (path: string): string => {
    const normalizedPath = normalizeApiPath(path);

    if (configuredApiBase) {
        return `${configuredApiBase}${normalizedPath}`;
    }

    if (isLocalHost()) {
        return `${localFallbackApiBase}${normalizedPath}`;
    }

    return normalizedPath;
};

const localApiUrl = (pathOrUrl: string): string => {
    if (isAbsoluteUrl(pathOrUrl)) return pathOrUrl;
    return `${localFallbackApiBase}${normalizeApiPath(pathOrUrl)}`;
};

export const initializeApiClient = (): void => {
    // Admin screens still use relative axios paths, so set a runtime base URL once.
    if (configuredApiBase) {
        axios.defaults.baseURL = configuredApiBase;
        return;
    }

    if (isLocalHost()) {
        axios.defaults.baseURL = localFallbackApiBase;
    }
};

export const resolveMediaUrl = (pathOrUrl?: string | null): string => {
    const raw = String(pathOrUrl || '').trim();
    if (!raw) return '';

    const legacyUploadsMatch = raw.match(/^\/uploads\/([^/?#]+)(.*)?$/i);
    if (legacyUploadsMatch) {
        const encodedFilename = encodeURIComponent(legacyUploadsMatch[1]);
        const suffix = legacyUploadsMatch[2] || '';
        const mappedPath = `/api/blogs/image/${encodedFilename}${suffix}`;

        if (configuredApiBase) {
            return `${configuredApiBase}${mappedPath}`;
        }

        if (isLocalHost()) {
            return `${localFallbackApiBase}${mappedPath}`;
        }

        return mappedPath;
    }

    if (raw.startsWith('data:')) {
        return raw;
    }

    if (isAbsoluteUrl(raw)) {
        try {
            const parsed = new URL(raw);
            const isLocalhostUrl = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
            if (isLocalhostUrl && !isLocalHost()) {
                const localPath = `${parsed.pathname}${parsed.search || ''}`;
                if (configuredApiBase) {
                    return `${configuredApiBase}${normalizeApiPath(localPath)}`;
                }
                return normalizeApiPath(localPath);
            }
        } catch {
            // Fallback to raw absolute URL if parsing fails.
        }
        return raw;
    }

    if (configuredApiBase) {
        return `${configuredApiBase}${normalizeApiPath(raw)}`;
    }

    if (isLocalHost()) {
        return `${localFallbackApiBase}${normalizeApiPath(raw)}`;
    }

    return normalizeApiPath(raw);
};

export const requestWithApiFallback = async <T>(
    primaryRequest: () => Promise<AxiosResponse<T>>
): Promise<AxiosResponse<T>> => {
    let firstError: any;

    try {
        return await primaryRequest();
    } catch (error: any) {
        firstError = error;
    }

    if (shouldRetryTransient(firstError)) {
        await sleep(250);
        try {
            return await primaryRequest();
        } catch {
            // Proceed to local fallback check with original error context.
        }
    }

    try {
        throw firstError;
    } catch (error: any) {
        if (!shouldRetryWithLocalFallback(error)) {
            throw firstError;
        }

        const originalConfig = error?.config as AxiosRequestConfig | undefined;
        if (!originalConfig || typeof originalConfig.url !== 'string') {
            throw error;
        }

        const retryConfig: AxiosRequestConfig = {
            ...originalConfig,
            baseURL: undefined,
            url: localApiUrl(originalConfig.url)
        };

        return axios.request<T>(retryConfig);
    }
};

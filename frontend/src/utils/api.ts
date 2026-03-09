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

export const resolveMediaUrl = (pathOrUrl?: string | null): string => {
    const raw = String(pathOrUrl || '').trim();
    if (!raw) return '';

    if (isAbsoluteUrl(raw) || raw.startsWith('data:')) {
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
    try {
        return await primaryRequest();
    } catch (error: any) {
        if (!shouldRetryWithLocalFallback(error)) {
            throw error;
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

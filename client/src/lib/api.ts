/**
 * api.ts — Central API base URL resolver
 *
 * In development & web: relative paths (proxied by Vite/Express on same origin)
 * In native Capacitor app: absolute URL read from VITE_API_BASE_URL env var
 *
 * Usage:
 *   import { apiUrl } from '@/lib/api';
 *   fetch(apiUrl('/api/voice-entries'), { credentials: 'include' })
 */

// Capacitor detects native context via the custom scheme
const isNative = typeof window !== 'undefined' &&
    (window.location.protocol === 'capacitor:' ||
        window.location.protocol === 'ionic:' ||
        navigator.userAgent.includes('CapacitorWebView'));

// Set VITE_API_BASE_URL in your .env.production / railway env vars
const CONFIGURED_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;

export const API_BASE: string = isNative && CONFIGURED_BASE
    ? CONFIGURED_BASE.replace(/\/$/, '') // strip trailing slash
    : '';                                 // empty = relative (web)

/**
 * Resolves an API path to a full or relative URL.
 * @param path  Must start with '/', e.g. '/api/auth/me'
 */
export function apiUrl(path: string): string {
    return `${API_BASE}${path}`;
}

/**
 * Thin wrapper around fetch that automatically resolves API_BASE.
 * Drop-in for fetch('/api/...', ...) calls.
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
    return fetch(apiUrl(path), {
        credentials: 'include',
        ...init,
    });
}

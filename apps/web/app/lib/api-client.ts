import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  isAxiosError,
} from 'axios';
import { loginResponseSchema } from '@/lib/schemas';
import { useAuthStore } from '@/stores/auth.store';

// ── Constants ────────────────────────────────────────────────────────────────

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

// ── Axios instances ──────────────────────────────────────────────────────────

/** Main API client — every request attaches the in-memory access token. */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // always send cookies (refreshToken)
  headers: { 'Content-Type': 'application/json' },
});

/**
 * A dedicated client for the /auth/refresh call.
 * This avoids the response-interceptor loop that would occur if we used
 * `apiClient` to refresh and that refresh itself returned 401.
 */
const refreshClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// ── Helpers ──────────────────────────────────────────────────────────────────

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const AUTH_ENDPOINTS = ['/auth/login', '/auth/refresh', '/auth/logout'];

const isAuthEndpoint = (url?: string): boolean =>
  !!url && AUTH_ENDPOINTS.some((path) => url.includes(path));

/** Sets (or clears) the default Authorization header on the main client. */
export const setAuthHeader = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
};

// ── Session hint (lightweight localStorage flag) ─────────────────────────────

const SESSION_HINT_KEY = 'session_active';

/**
 * Sets a non-sensitive flag in localStorage indicating that a session exists.
 * This prevents unnecessary /auth/refresh calls on pages where the user
 * has never logged in (no cookie = guaranteed 401).
 */
export const setSessionHint = () => {
  try {
    localStorage.setItem(SESSION_HINT_KEY, '1');
  } catch {
    // localStorage unavailable (SSR, private browsing quota, etc.)
  }
};

export const clearSessionHint = () => {
  try {
    localStorage.removeItem(SESSION_HINT_KEY);
  } catch {
    // noop
  }
};

export const hasSessionHint = (): boolean => {
  try {
    return localStorage.getItem(SESSION_HINT_KEY) === '1';
  } catch {
    return false;
  }
};

// ── Token refresh (singleton promise) ────────────────────────────────────────

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Attempts to obtain a fresh access token using the httpOnly refresh-token
 * cookie. Coalesces concurrent calls into a single request.
 *
 * On success: updates Zustand store + Authorization header.
 * On failure: clears everything (user must re-login).
 */
const refreshAccessToken = async (): Promise<string | null> => {
  // Coalesce: if a refresh is already in-flight, piggyback on it.
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;

  refreshPromise = (async () => {
    try {
      const response = await refreshClient.post('/auth/refresh');
      const parsed = loginResponseSchema.parse(response.data);
      const { accessToken, user } = parsed;

      useAuthStore.getState().setAuth({ accessToken, user });
      setAuthHeader(accessToken);

      return accessToken;
    } catch {
      // Refresh failed — cookie expired or invalid.
      useAuthStore.getState().logout();
      setAuthHeader(null);
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// ── Session initializer (page load / F5) ─────────────────────────────────────

/**
 * Called once at app startup to try restoring the session from the httpOnly
 * refresh-token cookie. Returns `true` if a valid session was restored.
 *
 * Skips the network call entirely if no session hint exists in localStorage
 * (i.e., the user has never logged in or has explicitly logged out).
 */
export const initializeSession = async (): Promise<boolean> => {
  // No hint → no cookie → don't bother calling the backend.
  if (!hasSessionHint()) {
    return false;
  }

  const token = await refreshAccessToken();

  if (!token) {
    // Refresh failed — cookie expired or revoked. Clean up the hint.
    clearSessionHint();
  }

  return token !== null;
};

// ── Request interceptor ──────────────────────────────────────────────────────

apiClient.interceptors.request.use((config) => {
  // Always attach the latest in-memory token.
  const token = useAuthStore.getState().accessToken;
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Debug error interceptor (dev only) ───────────────────────────────────────

/**
 * Formats backend errors into rich, readable console output.
 * Handles NestJS standard errors, nestjs-zod validation errors, and
 * generic Axios errors. Runs BEFORE the 401-refresh interceptor so
 * that auto-retry errors are also visible.
 */
if (import.meta.env.DEV) {
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (isAxiosError(error)) {
        const { config, response } = error;
        const method = config?.method?.toUpperCase() ?? '?';
        const url = config?.url ?? '?';
        const status = response?.status ?? 0;
        const data = response?.data as Record<string, unknown> | undefined;

        // ── Build the header ─────────────────────────────────────────────
        const label = `🚨 API Error: ${method} ${url} → ${status}`;

        console.groupCollapsed(
          `%c${label}`,
          'color: #ff6b6b; font-weight: bold; font-size: 12px;',
        );

        // ── Summary ──────────────────────────────────────────────────────
        const message =
          data?.message ??
          data?.error ??
          error.message ??
          'Unknown error';

        console.log(
          '%cMessage:%c %s',
          'color: #ffa94d; font-weight: bold;',
          'color: inherit;',
          message,
        );

        console.log(
          '%cStatus:%c %d %s',
          'color: #ffa94d; font-weight: bold;',
          'color: inherit;',
          status,
          response?.statusText ?? '',
        );

        // ── Zod / validation errors ──────────────────────────────────────
        // nestjs-zod returns: { errors: [{ code, message, path, ... }] }
        // NestJS ValidationPipe returns: { message: string[] } or { message: { ... } }
        const errors = data?.errors;

        if (Array.isArray(errors) && errors.length > 0) {
          console.group(
            '%c📋 Validation Errors (%d)',
            'color: #ff922b; font-weight: bold;',
            errors.length,
          );

          for (const err of errors as Record<string, unknown>[]) {
            const path = Array.isArray(err.path)
              ? (err.path as string[]).join('.')
              : String(err.path ?? '?');
            const code = err.code ?? err.validation ?? '';
            const msg = err.message ?? '';

            console.log(
              '  %c%s%c → %s %c(%s)',
              'color: #845ef7; font-weight: bold;',
              path,
              'color: inherit;',
              msg,
              'color: #868e96;',
              code,
            );
          }

          console.groupEnd();
        }

        // message as array (standard NestJS ValidationPipe)
        if (Array.isArray(data?.message)) {
          console.group(
            '%c📋 Validation Messages (%d)',
            'color: #ff922b; font-weight: bold;',
            (data?.message as unknown[]).length,
          );
          for (const msg of data?.message as string[]) {
            console.log('  •', msg);
          }
          console.groupEnd();
        }

        // ── Full response payload ────────────────────────────────────────
        if (data) {
          console.groupCollapsed(
            '%c📦 Response Payload',
            'color: #868e96;',
          );
          console.dir(data, { depth: 5 });
          console.groupEnd();
        }

        // ── Request body (if any) ────────────────────────────────────────
        if (config?.data) {
          console.groupCollapsed(
            '%c📤 Request Body',
            'color: #868e96;',
          );
          try {
            console.dir(
              typeof config.data === 'string'
                ? JSON.parse(config.data)
                : config.data,
              { depth: 5 },
            );
          } catch {
            console.log(config.data);
          }
          console.groupEnd();
        }

        // ── Request headers ──────────────────────────────────────────────
        console.groupCollapsed(
          '%c🔑 Request Headers',
          'color: #868e96;',
        );
        console.dir(config?.headers, { depth: 3 });
        console.groupEnd();

        console.groupEnd(); // close main group
      } else {
        // Non-Axios error (network down, CORS, etc.)
        console.error('🚨 Non-HTTP API Error:', error);
      }

      return Promise.reject(error);
    },
  );
}

// ── Response interceptor (transparent 401 → refresh → retry) ─────────────────

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (
      isAxiosError(error) &&
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest.url)
    ) {
      originalRequest._retry = true;

      const token = await refreshAccessToken();

      if (token) {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      }

      // Refresh failed — redirect to login.
      if (typeof window !== 'undefined') {
        window.location.assign('/login');
      }
    }

    return Promise.reject(error);
  },
);


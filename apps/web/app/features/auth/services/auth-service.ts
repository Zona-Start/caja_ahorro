import { apiClient, setAuthHeader, setSessionHint, clearSessionHint } from '@/lib/api-client';
import { loginResponseSchema, type LoginInput } from '@/lib/schemas';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Authentication service — single source of truth for login/logout API calls.
 * All token handling is in-memory; the refresh token lives as an httpOnly cookie.
 */
export const authService = {
  /**
   * Authenticate with username + password.
   * On success: stores accessToken + user in Zustand, sets Authorization header,
   * and marks the session hint so that F5 triggers a refresh.
   * The refresh token is automatically set as an httpOnly cookie by the backend.
   */
  async login(credentials: LoginInput) {
    const response = await apiClient.post('/auth/login', credentials);
    const parsed = loginResponseSchema.parse(response.data);

    useAuthStore.getState().setAuth({
      accessToken: parsed.accessToken,
      user: parsed.user,
    });
    setAuthHeader(parsed.accessToken);
    setSessionHint();

    return parsed;
  },

  /**
   * Logout: revoke session server-side, clear in-memory state, remove cookie.
   */
  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Even if the server call fails, we still clear client-side state.
    } finally {
      useAuthStore.getState().logout();
      setAuthHeader(null);
      clearSessionHint();
    }
  },

  /**
   * Revoke all sessions for the current user across all devices.
   */
  async logoutAll() {
    try {
      await apiClient.post('/auth/logout-all');
    } catch {
      // Best-effort
    } finally {
      useAuthStore.getState().logout();
      setAuthHeader(null);
      clearSessionHint();
    }
  },
};

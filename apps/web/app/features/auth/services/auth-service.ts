import {
  apiClient,
  clearSessionHint,
  setAuthHeader,
  setSessionHint,
} from '@/lib/api-client';
import { loginResponseSchema, type LoginInput } from '@/lib/schemas';
import { tenantApi } from '@/lib/tenant-api';
import { useAuthStore } from '@/stores/auth.store';
import { useTenantStore } from '@/stores/tenant.store';

export const authService = {
  async login(credentials: LoginInput) {
    const tenantId =
      credentials.tenantId ?? useTenantStore.getState().tenant?.id;

    const response = await apiClient.post('/auth/login', {
      identifier: credentials.identifier,
      password: credentials.password,
      ...(tenantId ? { tenantId } : {}),
    });

    const parsed = loginResponseSchema.parse(response.data);
    useAuthStore.getState().setAuth({
      accessToken: parsed.accessToken,
      user: parsed.user,
    });
    setAuthHeader(parsed.accessToken);
    setSessionHint();

    return parsed;
  },

  async lookupWorkspace(email: string) {
    return tenantApi.lookupWorkspace(email);
  },

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

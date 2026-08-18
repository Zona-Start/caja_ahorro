import type { ResolveTenantPayload, TenantBrand } from '@/stores/tenant.store';
import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

export const publicApiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export const tenantApi = {
  async resolveHost(host: string): Promise<ResolveTenantPayload> {
    const { data } = await publicApiClient.get<ResolveTenantPayload>(
      '/public/tenants/resolve',
      { params: { host } },
    );
    return data;
  },

  async lookupWorkspace(
    email: string,
  ): Promise<{ tenants: TenantBrand[]; isSystemAdmin: boolean }> {
    const { data } = await publicApiClient.post<{
      tenants: TenantBrand[];
      isSystemAdmin: boolean;
    }>('/public/auth/workspace-lookup', { email });
    return data;
  },
};

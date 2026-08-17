import { create } from 'zustand';

export interface TenantBrand {
  id: string;
  name: string;
  slug: string | null;
  customDomain: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  loginMode: 'CUSTOM_DOMAIN' | 'SUBDOMAIN';
}

export type ResolvedTenantType =
  | 'platform'
  | 'subdomain'
  | 'custom'
  | 'unknown'
  | null;

export interface ResolveTenantPayload {
  type: 'platform' | 'subdomain' | 'custom' | 'unknown';
  slug?: string;
  domain?: string;
  tenant: TenantBrand | null;
}

interface TenantState {
  type: ResolvedTenantType;
  slug: string | null;
  domain: string | null;
  tenant: TenantBrand | null;
  isResolving: boolean;
  setResolved: (payload: ResolveTenantPayload) => void;
  setError: () => void;
}

export const useTenantStore = create<TenantState>()((set) => ({
  type: null,
  slug: null,
  domain: null,
  tenant: null,
  isResolving: true,
  setResolved: (payload) =>
    set({
      type: payload.type,
      slug: payload.slug ?? null,
      domain: payload.domain ?? null,
      tenant: payload.tenant,
      isResolving: false,
    }),
  setError: () =>
    set({
      type: 'unknown',
      slug: null,
      domain: null,
      tenant: null,
      isResolving: false,
    }),
}));

import type { Membership, User } from '@/lib/schemas';
import { useAuthStore } from '@/stores/auth.store';

export type BusinessType =
  | 'CAJA_AHORRO'
  | 'EMPRESA_CORPORATIVA'
  | 'EMPRESA_COMERCIAL';

export const BUSINESS_TYPES = [
  'CAJA_AHORRO',
  'EMPRESA_CORPORATIVA',
  'EMPRESA_COMERCIAL',
] as const satisfies readonly BusinessType[];

function normalizeBusinessType(value: unknown): BusinessType | null {
  if (typeof value !== 'string') return null;
  const normalized = value.toUpperCase();
  return (BUSINESS_TYPES as readonly string[]).includes(normalized)
    ? (normalized as BusinessType)
    : null;
}

function resolveActiveMembership(
  memberships: Membership[],
  activeTenantId: string | null | undefined,
): Membership | undefined {
  if (activeTenantId) {
    const match = memberships.find((m) => m.tenantId === activeTenantId);
    if (match) return match;
  }
  return memberships[0];
}

/**
 * Resolves the active tenant's business type from the authenticated user.
 *
 * The API exposes the value as `bussinessType` (legacy spelling) inside each
 * membership. We tolerate both keys and also check `activeTenant` in case the
 * backend starts sending it there.
 */
export function getActiveBusinessType(user: User | null): BusinessType | null {
  if (!user) return null;

  const membership = resolveActiveMembership(
    user.memberships ?? [],
    user.activeTenantId,
  );

  return (
    normalizeBusinessType(membership?.businessType) ??
    normalizeBusinessType(membership?.bussinessType) ??
    normalizeBusinessType(user.activeTenant?.businessType) ??
    null
  );
}

export function isCommerce(user: User | null): boolean {
  return getActiveBusinessType(user) === 'EMPRESA_COMERCIAL';
}

export function isCorporate(user: User | null): boolean {
  const businessType = getActiveBusinessType(user);
  return (
    businessType === 'CAJA_AHORRO' ||
    businessType === 'EMPRESA_CORPORATIVA'
  );
}

export function useBusinessType(): BusinessType | null {
  return useAuthStore((state) => getActiveBusinessType(state.user));
}

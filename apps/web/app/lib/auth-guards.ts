import { useAuthStore } from '@/stores/auth.store';
import { initializeSession } from '@/lib/api-client';
import { redirect } from 'react-router';
import { hasPermission } from '@/lib/permissions';
import {
  getActiveBusinessType,
  type BusinessType,
} from '@/lib/business-type';

/**
 * Route guard: ensures the user is authenticated before accessing a route.
 *
 * If the in-memory token is gone (e.g. after F5), it transparently attempts
 * to restore the session via the httpOnly refresh-token cookie.
 *
 * Usage — in any route's `clientLoader`:
 *   export async function clientLoader() {
 *     await requireAuthenticated();
 *     return null;
 *   }
 */
export async function requireAuthenticated(): Promise<void> {
  const { isAuthenticated, accessToken } = useAuthStore.getState();

  if (!isAuthenticated || !accessToken) {
    const restored = await initializeSession();
    if (!restored) {
      throw redirect('/login');
    }
  }
}

/**
 * Route guard: ensures the user holds a specific permission.
 * Automatically chains through `requireAuthenticated` first.
 *
 * Usage:
 *   export async function clientLoader() {
 *     await requirePermission('iam:users', 'read');
 *     return null;
 *   }
 */
export async function requirePermission(
  resource: string,
  action: string,
  scope?: string,
): Promise<void> {
  await requireAuthenticated();

  const { user } = useAuthStore.getState();

  // System admins bypass permission checks.
  if (user?.isSystemAdmin) return;

  const permissions = user?.permissions ?? [];
  if (!hasPermission(permissions, resource, action, scope)) {
    throw redirect('/dashboard');
  }
}

/**
 * Route guard: ensures the active tenant matches one of the allowed business
 * types. When the business type is unknown we fail open (allow the navigation)
 * to avoid locking users out if the API omits the field.
 *
 * Usage:
 *   export async function clientLoader() {
 *     await requireBusinessType('EMPRESA_COMERCIAL');
 *     return null;
 *   }
 */
export async function requireBusinessType(
  ...allowed: BusinessType[]
): Promise<void> {
  await requireAuthenticated();

  const { user } = useAuthStore.getState();
  const businessType = getActiveBusinessType(user);

  if (!businessType) return;
  if (!allowed.includes(businessType)) {
    throw redirect('/dashboard');
  }
}

/** Restricts a route to commerce tenants (`EMPRESA_COMERCIAL`). */
export async function requireCommerce(): Promise<void> {
  await requireBusinessType('EMPRESA_COMERCIAL');
}

/** Restricts a route to corporate tenants (`CAJA_AHORRO` | `EMPRESA_CORPORATIVA`). */
export async function requireCorporate(): Promise<void> {
  await requireBusinessType('CAJA_AHORRO', 'EMPRESA_CORPORATIVA');
}

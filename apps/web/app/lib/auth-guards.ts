import { useAuthStore } from '@/stores/auth.store';
import { initializeSession } from '@/lib/api-client';
import { redirect } from 'react-router';
import { hasPermission } from '@/lib/permissions';

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

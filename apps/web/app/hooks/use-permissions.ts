import { useAuthStore } from '@/stores/auth.store';
import { useCallback, useMemo } from 'react';
import type { Permission } from '@/lib/schemas';

/**
 * Hook to check permissions in components.
 *
 * Returns:
 *  - `can(resource, action, scope?)` — true if the user holds the permission.
 *  - `permissions` — the raw permission array for the current user.
 *  - `isSystemAdmin` — shortcut for system admin check.
 *
 * Usage:
 *   const { can } = usePermissions();
 *   if (can('iam:users', 'create')) { ... }
 */
export function usePermissions() {
  const user = useAuthStore((s) => s.user);
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const can = useCallback(
    (resource: string, action: string, scope?: string): boolean => {
      return hasPermission(resource, action, scope);
    },
    [hasPermission],
  );

  const permissions: Permission[] = useMemo(
    () => user?.permissions ?? [],
    [user?.permissions],
  );

  const isSystemAdmin = user?.isSystemAdmin ?? false;

  return { can, permissions, isSystemAdmin } as const;
}

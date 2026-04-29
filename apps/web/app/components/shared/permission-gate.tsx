import { usePermissions } from '@/hooks/use-permissions';
import type { ReactNode } from 'react';

interface PermissionGateProps {
  /** The resource identifier, e.g. 'iam:users' */
  resource: string;
  /** The action, e.g. 'read', 'create', 'update', 'delete' */
  action: string;
  /** Optional scope level, e.g. 'tenant', 'global' */
  scope?: string;
  /** Content to render when the user HAS the permission. */
  children: ReactNode;
  /** Optional content to render when the user LACKS the permission. */
  fallback?: ReactNode;
}

/**
 * Declarative permission gate component.
 *
 * Use to conditionally render UI elements (buttons, menus, sections)
 * based on the current user's permissions.
 *
 * Example:
 *   <PermissionGate resource="iam:users" action="create">
 *     <Button>Create User</Button>
 *   </PermissionGate>
 *
 *   <PermissionGate resource="iam:users" action="delete" scope="global"
 *     fallback={<Button disabled>Delete</Button>}
 *   >
 *     <Button variant="destructive">Delete</Button>
 *   </PermissionGate>
 */
export function PermissionGate({
  resource,
  action,
  scope,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { can } = usePermissions();

  if (can(resource, action, scope)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

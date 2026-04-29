import type { Permission } from '@/lib/schemas';

/**
 * Priority ladder for permission scopes.
 * Higher numbers grant broader access and subsume lower ones.
 */
const scopePriority: Record<string, number> = {
  own: 1,
  team: 2,
  department: 3,
  branch: 4,
  tenant: 5,
  all: 6,
  global: 7,
};

/**
 * Checks whether the given permission set satisfies a (resource, action, scope)
 * requirement.
 *
 * Rules:
 *  - If the user holds any permission matching resource + action, access is
 *    granted (when no specific scope is required).
 *  - If a `requiredScope` is specified, at least one matching permission must
 *    have a scope >= the required level according to `scopePriority`.
 */
export function hasPermission(
  permissions: Permission[],
  resource: string,
  action: string,
  requiredScope?: string,
): boolean {
  const matched = permissions.filter(
    (p) => p.resource === resource && p.action === action,
  );

  if (matched.length === 0) return false;
  if (!requiredScope) return true;

  const requiredLevel = scopePriority[requiredScope] ?? 0;

  return matched.some((p) => {
    const currentLevel = scopePriority[p.scope ?? 'own'] ?? 0;
    return currentLevel >= requiredLevel;
  });
}

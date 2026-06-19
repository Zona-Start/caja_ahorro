import type { Permission } from '../schemas/roles.schema';

export const PERMISSION_GROUPS: Record<string, string> = {
  iam: 'IAM - Usuarios y Accesos',
  system: 'Sistema',
  savings: 'Caja de Ahorro',
  portfolio: 'Portafolio',
  accounting: 'Contabilidad',
  inventory: 'Inventario',
  catalog: 'Catálogos',
};

export interface GroupedPermissions {
  prefix: string;
  label: string;
  permissions: Permission[];
}

const GROUP_ORDER = Object.keys(PERMISSION_GROUPS);

function getGroupPrefix(resource: string): string {
  const idx = resource.indexOf(':');
  return idx > 0 ? resource.slice(0, idx) : resource;
}

export function groupPermissions(allPermissions: Permission[]): GroupedPermissions[] {
  const groups = new Map<string, Permission[]>();

  for (const p of allPermissions) {
    const prefix = getGroupPrefix(p.resource);
    const list = groups.get(prefix);
    if (list) {
      list.push(p);
    } else {
      groups.set(prefix, [p]);
    }
  }

  const result: GroupedPermissions[] = [];

  for (const prefix of GROUP_ORDER) {
    const permissions = groups.get(prefix);
    if (permissions) {
      result.push({
        prefix,
        label: PERMISSION_GROUPS[prefix] ?? prefix,
        permissions,
      });
    }
  }

  for (const [prefix, permissions] of groups) {
    if (!GROUP_ORDER.includes(prefix)) {
      result.push({
        prefix,
        label: prefix.charAt(0).toUpperCase() + prefix.slice(1),
        permissions,
      });
    }
  }

  return result;
}

export const permissionActionEnum = [
  'read', 'create', 'update', 'delete', 'execute', 'approve', 'reject',
  'process', 'disburse', 'mass_upload', 'mass_disburse',
] as const;


export const permissionScopeEnum = [
  'all', 'team', 'department', 'branch', 'tenant', 'global', 'own',
] as const;

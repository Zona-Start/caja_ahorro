export const auditActionsEnum = [
  'create',
  'read',
  'update',
  'delete',
  'login',
  'logout',
  'refresh',
  'export',
  'import',
] as const;

export const auditTargetTypesEnum = [
  'user',
  'role',
  'permission',
  'session',
  'associate',
  'tenant',
  'category',
  'account',
  'transaction',
  'report',
  'settings',
  'accounting_rule',
  'module_setting',
  'withdrawal',
  'withdrawal_type',
  'loan',
  'loan_type',
  'loan_payment',
  'credit_request',
  'credit_payment',
  'credit_type',
] as const;

export const severityLevelsEnum = [
  'debug',
  'info',
  'warning',
  'error',
  'critical',
] as const;

export const systemEventTypesEnum = [
  'database_error',
  'validation_error',
  'authentication_failed',
  'authorization_failed',
  'rate_limit_exceeded',
  'internal_server_error',
  'external_api_error',
  'cron_job_failed',
  'backup_failed',
] as const;

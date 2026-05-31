import { auditSchema } from "../_schemas";


export const auditActionsEnum = auditSchema.enum('audit_action', [
  'create',
  'read',
  'update',
  'delete',
  'login',
  'logout',
  'refresh',
  'export',
  'import',
]);

export const auditTargetTypesEnum = auditSchema.enum('audit_target_type', [
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
  'credit_type'
]);

export const severityLevelsEnum = auditSchema.enum('severity_level', [
  'debug',
  'info',
  'warning',
  'error',
  'critical',
]);

export const systemEventTypesEnum = auditSchema.enum('system_event_type', [
  'database_error',
  'validation_error',
  'authentication_failed',
  'authorization_failed',
  'rate_limit_exceeded',
  'internal_server_error',
  'external_api_error',
  'cron_job_failed',
  'backup_failed',
]);

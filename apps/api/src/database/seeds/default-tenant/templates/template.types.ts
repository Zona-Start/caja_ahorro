export interface AccountEntry {
  code: string;
  name: string;
  accountType:
    'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE' | 'MEMORANDUM';
  nature: 'DEBIT' | 'CREDIT';
  level: number;
  allowsMovements: boolean;
  isActive: boolean;
  parentCode?: string;
}

export interface TemplateRolePermission {
  resource: string;
  actions: string[];
}

export interface TemplateRole {
  name: string;
  description: string;
  isDefault: boolean;
  /**
   * Permisos adicionales que deben asignarse a este rol además de los que
   * ya define la lógica general del seed. Sirve para módulos nuevos que no
   * encajan en los filtros por prefijo existentes.
   */
  permissions?: TemplateRolePermission[];
}

export interface TenantSetting {
  key: string;
  value: string;
  description: string;
  category: string;
}

export interface ModuleSetting {
  module: string;
  submodule: string;
  key: string;
  value: string;
  description: string;
}

export interface TemplateCategory {
  type: string;
  code: string;
  name: string;
  metadata?: Record<string, any>;
}

export interface BusinessTypeTemplate {
  defaultModules: string[];
  roles: TemplateRole[];
  settings: TenantSetting[];
  moduleSettings: ModuleSetting[];
  categories: TemplateCategory[];
  accounts: AccountEntry[];
}

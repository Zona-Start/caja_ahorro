// export const DEFAULT_PERMISSIONS = [
//   // ==========================================
//   // MÓDULO IAM (Identidad y Accesos del Tenant)
//   // Uso principal: Rol Admin
//   // ==========================================
//   {
//     resource: "iam:users",
//     action: "create",
//     name: "Crear Usuarios",
//     description:
//       "Permite registrar nuevos usuarios y darles acceso a la empresa.",
//     scope: "tenant",
//   },
//   {
//     resource: "iam:users",
//     action: "read",
//     name: "Consultar Usuarios",
//     description:
//       "Permite ver la lista de usuarios y sus perfiles dentro de la empresa.",
//     scope: "tenant",
//   },
//   {
//     resource: "iam:users",
//     action: "update",
//     name: "Editar Usuarios",
//     description:
//       "Permite modificar datos, bloquear o reactivar usuarios de la empresa.",
//     scope: "tenant",
//   },
//   {
//     resource: "iam:users",
//     action: "delete",
//     name: "Eliminar Usuarios",
//     description: "Permite eliminar usuarios de la empresa.",
//     scope: "tenant",
//   },
//   {
//     resource: "iam:roles",
//     action: "create",
//     name: "Crear Roles Personalizados",
//     description: "Permite diseñar nuevos roles a la medida para la empresa.",
//     scope: "tenant",
//   },
//   {
//     resource: "iam:roles",
//     action: "read",
//     name: "Consultar Roles",
//     description:
//       "Permite ver la lista de roles y los permisos que tienen asignados.",
//     scope: "tenant",
//   },
//   {
//     resource: "iam:roles",
//     action: "update",
//     name: "Editar Roles",
//     description: "Permite editar los roles de la organización.",
//     scope: "tenant",
//   },
//   {
//     resource: "iam:roles",
//     action: "delete",
//     name: "Eliminar Roles",
//     description: "Permite eliminar roles de la organización.",
//     scope: "tenant",
//   },
//   {
//     resource: "iam:sessions",
//     action: "delete",
//     name: "Revocar Sesiones",
//     description:
//       "Permite forzar el cierre de sesión de un usuario de la empresa por seguridad.",
//     scope: "global",
//   },

//   // ==========================================
//   // MÓDULO SYSTEM (Configuración y Parametrización del Tenant)
//   // Uso principal: Rol Admin
//   // ==========================================
//   {
//     resource: "system:tenants-systems",
//     action: "read",
//     name: "Consultar Parámetros de Organización",
//     description: "Consultar los parámetros generales por organización.",
//     scope: "tenant",
//   },
//   {
//     resource: "system:tenants-systems",
//     action: "update",
//     name: "Editar Datos de Empresa",
//     description:
//       "Permite modificar los datos y configuraciones base de la empresa.",
//     scope: "tenant",
//   },
//   {
//     resource: "system:modules",
//     action: "read",
//     name: "Consultar Parámetros de Módulos",
//     description: "Permite consultar los parámetros por módulos.",
//     scope: "tenant",
//   },
//   {
//     resource: "system:modules",
//     action: "update",
//     name: "Editar Parámetros de Módulos",
//     description: "Permite actualizar los parámetros específicos por módulos.",
//     scope: "tenant",
//   },

//   // ==========================================
//   // MÓDULO SAVINGS (Caja de Ahorro / Asociados)
//   // Uso: Asistentes (CRUD básico), Ejecutivos (Aprobaciones)
//   // ==========================================
//   {
//     resource: "savings:members",
//     action: "create",
//     name: "Registrar Asociado",
//     description:
//       "Permite dar de alta a un nuevo asociado en la caja de ahorro.",
//     scope: "tenant",
//   },
//   {
//     resource: "savings:members",
//     action: "read",
//     name: "Consultar Asociados",
//     description:
//       "Permite ver el expediente, estado de cuenta y datos del asociado.",
//     scope: "tenant",
//   },
//   {
//     resource: "savings:contributions",
//     action: "create",
//     name: "Carga Manual de Haberes",
//     description: "Permite cargar aportes y retenciones por nómina manualmente.",
//     scope: "tenant",
//   },
//   {
//     resource: "savings:contributions",
//     action: "read",
//     name: "Consultar Haberes",
//     description: "Permite consultar aportes y retenciones por nómina.",
//     scope: "tenant",
//   },
//   {
//     resource: "savings:contributions",
//     action: "mass_upload",
//     name: "Carga Masiva de Haberes",
//     description:
//       "Permite subir archivos (Excel/CSV) para cargar aportes y retenciones por nómina.",
//     scope: "tenant",
//   },
//   {
//     resource: "savings:withdrawals",
//     action: "create",
//     name: "Cargar Solicitud de Retiro",
//     description:
//       "Permite registrar una solicitud de retiro de haberes (requiere aprobación).",
//     scope: "tenant",
//   },
//   {
//     resource: "savings:withdrawals",
//     action: "approve",
//     name: "Aprobar Retiros",
//     description:
//       "Permite a nivel gerencial dar el visto bueno a un retiro de haberes.",
//     scope: "tenant",
//   },
//   {
//     resource: "savings:liquidations",
//     action: "process",
//     name: "Procesar Liquidación",
//     description:
//       "Permite calcular y cerrar definitivamente los haberes de un asociado que se retira.",
//     scope: "tenant",
//   },
//   {
//     resource: "savings:liquidations",
//     action: "disburse",
//     name: "Desembolsar Liquidación",
//     description:
//       "Permite ejecutar la orden de pago y afectar el saldo en banco para una liquidación.",
//     scope: "tenant",
//   },

//   // ==========================================
//   // MÓDULO PORTFOLIO (Cartera y Préstamos)
//   // Uso: Asistentes (Carga), Ejecutivos (Aprobación/Desembolso)
//   // ==========================================
//   {
//     resource: "portfolio:loans",
//     action: "create",
//     name: "Cargar Solicitud de Préstamo",
//     description:
//       "Permite registrar una nueva solicitud de préstamo para un asociado.",
//     scope: "tenant",
//   },
//   {
//     resource: "portfolio:loans",
//     action: "approve",
//     name: "Aprobar Préstamos",
//     description:
//       "Permite evaluar y aprobar o rechazar solicitudes de préstamos.",
//     scope: "tenant",
//   },
//   {
//     resource: "portfolio:loans",
//     action: "disburse",
//     name: "Desembolsar Préstamos",
//     description:
//       "Permite liberar los fondos de un préstamo aprobado a la cuenta del asociado.",
//     scope: "tenant",
//   },
//   {
//     resource: "portfolio:payments",
//     action: "create",
//     name: "Cargar Pagos/Abonos",
//     description:
//       "Permite registrar pagos manuales a las cuotas de los préstamos.",
//     scope: "tenant",
//   },

//   // ==========================================
//   // MÓDULO ACCOUNTING (Contabilidad)
//   // Uso: Contador (Accountant)
//   // ==========================================
//   {
//     resource: "accounting:chart_of_accounts",
//     action: "create",
//     name: "Crear Cuentas Contables",
//     description:
//       "Permite agregar nuevas cuentas al plan de cuentas de la empresa.",
//     scope: "tenant",
//   },
//   {
//     resource: "accounting:chart_of_accounts",
//     action: "read",
//     name: "Consultar Plan de Cuentas",
//     description: "Permite visualizar la estructura contable y saldos actuales.",
//     scope: "tenant",
//   },
//   {
//     resource: "accounting:chart_of_accounts",
//     action: "update",
//     name: "Actualizar Plan de Cuentas",
//     description: "Permite actualizar la estructura contable y saldos actuales.",
//     scope: "tenant",
//   },
//   {
//     resource: "accounting:chart_of_accounts",
//     action: "delete",
//     name: "Eliminar Plan de Cuentas",
//     description: "Permite eliminar la estructura contable y saldos actuales.",
//     scope: "tenant",
//   },
//   {
//     resource: "accounting:journal_entries",
//     action: "create",
//     name: "Crear Asientos Contables",
//     description:
//       "Permite registrar comprobantes de diario manuales (en borrador).",
//     scope: "tenant",
//   },
//   {
//     resource: "accounting:journal_entries",
//     action: "read",
//     name: "Consultar Asientos Contables",
//     description:
//       "Permite consultar comprobantes de diario manuales (en borrador).",
//     scope: "tenant",
//   },
//   {
//     resource: "accounting:journal_entries",
//     action: "approve",
//     name: "Mayorizar Asientos (Postear)",
//     description:
//       "Permite aprobar un asiento contable para que afecte definitivamente los saldos.",
//     scope: "tenant",
//   },
//   {
//     resource: "accounting:cycles",
//     action: "process",
//     name: "Cierre de Mes/Ejercicio",
//     description:
//       "Permite ejecutar los procesos de cierre contable y cálculo de utilidades.",
//     scope: "tenant",
//   },
//   {
//     resource: "accounting:reports",
//     action: "read",
//     name: "Generar Estados Financieros",
//     description:
//       "Permite emitir Balance General, Estado de Resultados y libros contables.",
//     scope: "tenant",
//   },

//   // ==========================================
//   // MÓDULO BANKING (Bancos y Tesorería)
//   // Uso: Contador (Accountant) y Admin
//   // ==========================================
//   {
//     resource: "banking:accounts",
//     action: "create",
//     name: "Registrar Cuentas Bancarias",
//     description:
//       "Permite configurar las cuentas bancarias propias de la empresa.",
//     scope: "global",
//   },
//   {
//     resource: "banking:accounts",
//     action: "read",
//     name: "Consultar Cuentas Bancarias",
//     description:
//       "Permite consultar las cuentas bancarias propias de la empresa.",
//     scope: "tenant",
//   },
//   {
//     resource: "banking:transactions",
//     action: "create",
//     name: "Registrar Movimientos Bancarios",
//     description:
//       "Permite registrar notas de débito, crédito y transferencias manuales.",
//     scope: "tenant",
//   },
//   {
//     resource: "banking:reconciliation",
//     action: "process",
//     name: "Conciliar Bancos",
//     description:
//       "Permite ejecutar el proceso de conciliación entre el extracto bancario y el libro mayor.",
//     scope: "tenant",
//   },

//   // ==========================================
//   // CATÁLOGOS LOCALES (Propios de la empresa)
//   // ==========================================
//   {
//     resource: "catalog:categories",
//     action: "create",
//     name: "Crear Categorías Locales",
//     description:
//       "Permite parametrizar agrupaciones (ej. tipos de préstamos, departamentos).",
//     scope: "tenant",
//   },
//   {
//     resource: "catalog:categories",
//     action: "read",
//     name: "Consultar Categorías",
//     description: "Permite consultar las categorías registradas.",
//     scope: "tenant",
//   },
//   {
//     resource: "catalog:exchange_rates",
//     action: "read",
//     name: "Consultar Tasas de Cambio",
//     description:
//       "Permite visualizar el histórico de tasas de cambio (Solo lectura de data global).",
//     scope: "global",
//   },
// ] as const;

export const DEFAULT_PERMISSIONS = [
  // ==========================================
  // MÓDULO IAM (Identidad y Accesos del Tenant)
  // Uso principal: Rol Admin
  // ==========================================
  {
    resource: 'iam:users',
    action: 'create',
    name: 'Crear Usuarios',
    description:
      'Permite registrar nuevos usuarios y darles acceso a la empresa.',
    scope: 'tenant',
  },
  {
    resource: 'iam:users',
    action: 'read',
    name: 'Consultar Usuarios',
    description:
      'Permite ver la lista de usuarios y sus perfiles dentro de la empresa.',
    scope: 'tenant',
  },
  {
    resource: 'iam:users',
    action: 'update',
    name: 'Editar Usuarios',
    description:
      'Permite modificar datos, bloquear o reactivar usuarios de la empresa.',
    scope: 'tenant',
  },
  {
    resource: 'iam:users',
    action: 'delete',
    name: 'Eliminar Usuarios',
    description: 'Permite eliminar usuarios de la empresa.',
    scope: 'tenant',
  },
  {
    resource: 'iam:roles',
    action: 'create',
    name: 'Crear Roles Personalizados',
    description: 'Permite diseñar nuevos roles a la medida para la empresa.',
    scope: 'tenant',
  },
  {
    resource: 'iam:roles',
    action: 'read',
    name: 'Consultar Roles',
    description:
      'Permite ver la lista de roles y los permisos que tienen asignados.',
    scope: 'tenant',
  },
  {
    resource: 'iam:roles',
    action: 'update',
    name: 'Editar Roles',
    description: 'Permite editar los roles de la organización.',
    scope: 'tenant',
  },
  {
    resource: 'iam:roles',
    action: 'delete',
    name: 'Eliminar Roles',
    description: 'Permite eliminar roles de la organización.',
    scope: 'tenant',
  },
  {
    resource: 'iam:sessions',
    action: 'delete',
    name: 'Revocar Sesiones',
    description:
      'Permite forzar el cierre de sesión de un usuario de la empresa por seguridad.',
    scope: 'global',
  },

  // ==========================================
  // MÓDULO SYSTEM (Configuración y Parametrización del Tenant)
  // Uso principal: Rol Admin
  // ==========================================
  {
    resource: 'system:tenants-systems',
    action: 'read',
    name: 'Consultar Parámetros de Organización',
    description: 'Consultar los parámetros generales por organización.',
    scope: 'tenant',
  },
  {
    resource: 'system:tenants-systems',
    action: 'update',
    name: 'Editar Datos de Empresa',
    description:
      'Permite modificar los datos y configuraciones base de la empresa.',
    scope: 'tenant',
  },
  {
    resource: 'system:modules',
    action: 'read',
    name: 'Consultar Parámetros de Módulos',
    description: 'Permite consultar los parámetros por módulos.',
    scope: 'tenant',
  },
  {
    resource: 'system:modules',
    action: 'update',
    name: 'Editar Parámetros de Módulos',
    description: 'Permite actualizar los parámetros específicos por módulos.',
    scope: 'tenant',
  },

  // ==========================================
  // MÓDULO SAVINGS (Caja de Ahorro / Asociados)
  // Uso: Asistentes (CRUD básico), Ejecutivos (Aprobaciones)
  // ==========================================
  {
    resource: 'savings:members',
    action: 'create',
    name: 'Registrar Asociado',
    description:
      'Permite dar de alta a un nuevo asociado en la caja de ahorro.',
    scope: 'tenant',
  },
  {
    resource: 'savings:members',
    action: 'read',
    name: 'Consultar Asociados',
    description:
      'Permite ver el expediente, estado de cuenta y datos del asociado.',
    scope: 'tenant',
  },
  {
    resource: 'savings:contributions',
    action: 'create',
    name: 'Carga Manual de Haberes',
    description: 'Permite cargar aportes y retenciones por nómina manualmente.',
    scope: 'tenant',
  },
  {
    resource: 'savings:contributions',
    action: 'read',
    name: 'Consultar Haberes',
    description: 'Permite consultar aportes y retenciones por nómina.',
    scope: 'tenant',
  },
  {
    resource: 'savings:contributions',
    action: 'mass_upload',
    name: 'Carga Masiva de Haberes',
    description:
      'Permite subir archivos (Excel/CSV) para cargar aportes y retenciones por nómina.',
    scope: 'tenant',
  },
  {
    resource: 'savings:withdrawals',
    action: 'create',
    name: 'Cargar Solicitud de Retiro',
    description:
      'Permite registrar una solicitud de retiro de haberes (requiere aprobación).',
    scope: 'tenant',
  },
  {
    resource: 'savings:withdrawals',
    action: 'approve',
    name: 'Aprobar Retiros',
    description:
      'Permite a nivel gerencial dar el visto bueno a un retiro de haberes.',
    scope: 'tenant',
  },
  {
    resource: 'savings:liquidations',
    action: 'process',
    name: 'Procesar Liquidación',
    description:
      'Permite calcular y cerrar definitivamente los haberes de un asociado que se retira.',
    scope: 'tenant',
  },
  {
    resource: 'savings:liquidations',
    action: 'disburse',
    name: 'Desembolsar Liquidación',
    description:
      'Permite ejecutar la orden de pago y afectar el saldo en banco para una liquidación.',
    scope: 'tenant',
  },

  // ==========================================
  // MÓDULO PORTFOLIO (Cartera y Préstamos)
  // Uso: Asistentes (Carga), Ejecutivos (Aprobación/Desembolso)
  // ==========================================
  {
    resource: 'portfolio:loans',
    action: 'create',
    name: 'Cargar Solicitud de Préstamo',
    description:
      'Permite registrar una nueva solicitud de préstamo para un asociado.',
    scope: 'tenant',
  },
  {
    resource: 'portfolio:loans',
    action: 'approve',
    name: 'Aprobar Préstamos',
    description:
      'Permite evaluar y aprobar o rechazar solicitudes de préstamos.',
    scope: 'tenant',
  },
  {
    resource: 'portfolio:loans',
    action: 'disburse',
    name: 'Desembolsar Préstamos',
    description:
      'Permite liberar los fondos de un préstamo aprobado a la cuenta del asociado.',
    scope: 'tenant',
  },
  {
    resource: 'portfolio:payments',
    action: 'create',
    name: 'Cargar Pagos/Abonos',
    description:
      'Permite registrar pagos manuales a las cuotas de los préstamos.',
    scope: 'tenant',
  },

  // ==========================================
  // MÓDULO ACCOUNTING (Contabilidad)
  // Uso: Contador (Accountant)
  // ==========================================
  {
    resource: 'accounting:chart_of_accounts',
    action: 'create',
    name: 'Crear Cuentas Contables',
    description:
      'Permite agregar nuevas cuentas al plan de cuentas de la empresa.',
    scope: 'tenant',
  },
  {
    resource: 'accounting:chart_of_accounts',
    action: 'read',
    name: 'Consultar Plan de Cuentas',
    description: 'Permite visualizar la estructura contable y saldos actuales.',
    scope: 'tenant',
  },
  {
    resource: 'accounting:chart_of_accounts',
    action: 'update',
    name: 'Actualizar Plan de Cuentas',
    description: 'Permite actualizar la estructura contable y saldos actuales.',
    scope: 'tenant',
  },
  {
    resource: 'accounting:chart_of_accounts',
    action: 'delete',
    name: 'Eliminar Plan de Cuentas',
    description: 'Permite eliminar la estructura contable y saldos actuales.',
    scope: 'tenant',
  },
  {
    resource: 'accounting:journal_entries',
    action: 'create',
    name: 'Crear Asientos Contables',
    description:
      'Permite registrar comprobantes de diario manuales (en borrador).',
    scope: 'tenant',
  },
  {
    resource: 'accounting:journal_entries',
    action: 'read',
    name: 'Consultar Asientos Contables',
    description:
      'Permite consultar comprobantes de diario manuales (en borrador).',
    scope: 'tenant',
  },
  {
    resource: 'accounting:journal_entries',
    action: 'approve',
    name: 'Mayorizar Asientos (Postear)',
    description:
      'Permite aprobar un asiento contable para que afecte definitivamente los saldos.',
    scope: 'tenant',
  },
  {
    resource: 'accounting:cycles',
    action: 'read',
    name: 'Consultar Ciclos Contables',
    description: 'Consultar los ciclos contables de la organización',
    scope: 'tenant',
  },
  {
    resource: 'accounting:cycles',
    action: 'update',
    name: 'Editar Ciclos Contables',
    description: 'Permite editar los ciclos contables',
    scope: 'tenant',
  },
  {
    resource: 'accounting:cycles',
    action: 'delete',
    name: 'Eliminar Ciclos Contables',
    description: 'Permite eliminar o cancelar los ciclos contables',
    scope: 'tenant',
  },
  {
    resource: 'accounting:cycles',
    action: 'process',
    name: 'Cierre de Mes/Ejercicio',
    description:
      'Permite ejecutar los procesos de cierre contable y cálculo de utilidades.',
    scope: 'tenant',
  },
  {
    resource: 'accounting:rules',
    action: 'read',
    name: 'Consultar Reglas Contables',
    description: 'Permite Consultar Reglas Contables',
    scope: 'tenant',
  },
  {
    resource: 'accounting:rules',
    action: 'create',
    name: 'Crear Reglas Contables',
    description: 'Permite Crear Reglas Contables',
    scope: 'tenant',
  },
  {
    resource: 'accounting:rules',
    action: 'update',
    name: 'Editar Reglas Contables',
    description: 'Permite Editar Reglas Contables',
    scope: 'tenant',
  },
  {
    resource: 'accounting:rules',
    action: 'delete',
    name: 'Eliminar Reglas Contables',
    description: 'Permite Eliminar Reglas Contables',
    scope: 'tenant',
  },
  {
    resource: 'accounting:reports',
    action: 'read',
    name: 'Generar Estados Financieros',
    description:
      'Permite emitir Balance General, Estado de Resultados y libros contables.',
    scope: 'tenant',
  },

  // ==========================================
  // MÓDULO BANKING (Bancos y Tesorería)
  // Uso: Contador (Accountant) y Admin
  // ==========================================
  {
    resource: 'banking:accounts',
    action: 'create',
    name: 'Registrar Cuentas Bancarias',
    description:
      'Permite configurar las cuentas bancarias propias de la empresa.',
    scope: 'global',
  },
  {
    resource: 'banking:accounts',
    action: 'read',
    name: 'Consultar Cuentas Bancarias',
    description:
      'Permite consultar las cuentas bancarias propias de la empresa.',
    scope: 'tenant',
  },
  {
    resource: 'banking:transactions',
    action: 'create',
    name: 'Registrar Movimientos Bancarios',
    description:
      'Permite registrar notas de débito, crédito y transferencias manuales.',
    scope: 'tenant',
  },
  {
    resource: 'banking:reconciliation',
    action: 'process',
    name: 'Conciliar Bancos',
    description:
      'Permite ejecutar el proceso de conciliación entre el extracto bancario y el libro mayor.',
    scope: 'tenant',
  },

  // ==========================================
  // CATÁLOGOS LOCALES (Propios de la empresa)
  // ==========================================
  {
    resource: 'catalog:categories',
    action: 'create',
    name: 'Crear Categorías Locales',
    description:
      'Permite parametrizar agrupaciones (ej. tipos de préstamos, departamentos).',
    scope: 'tenant',
  },
  {
    resource: 'catalog:categories',
    action: 'read',
    name: 'Consultar Categorías',
    description: 'Permite consultar las categorías registradas.',
    scope: 'tenant',
  },
  {
    resource: 'catalog:exchange_rates',
    action: 'read',
    name: 'Consultar Tasas de Cambio',
    description:
      'Permite visualizar el histórico de tasas de cambio (Solo lectura de data global).',
    scope: 'global',
  },
] as const;

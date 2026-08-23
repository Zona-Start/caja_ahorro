// src/constants/navegations.ts
import {
  ArrowRightLeft,
  Boxes,
  Building2,
  ClipboardList,
  CreditCard,
  DollarSign,
  FileText,
  HandCoins,
  Landmark,
  Layers,
  LayoutDashboard,
  Lock,
  LucideIcon,
  Package,
  Receipt,
  Settings,
  Shield,
  ShoppingCart,
  Tag,
  Upload,
  UserCog,
  Users,
  Scale,
  BarChart3,
} from 'lucide-react';

export interface NavSubItem {
  label: string;
  href: string;
  requiresPermission?: {
    resource: string;
    action: string;
  };
}

export interface NavItem {
  label: string;
  href: string;
  icon?: LucideIcon;
  requiresPermission?: {
    resource: string;
    action: string;
  };
  items?: NavSubItem[];
}

export interface NavGroup {
  label: string;
  /**
   * Module codes (tenant modules) that must be active for this group to show.
   * When empty/undefined, the group is always visible and only its items are
   * gated by permissions. When present, the group shows if ANY code is active.
   */
  modules?: string[];
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: 'Dashboard',
    items: [
      {
        label: 'Inicio',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: 'Caja de Ahorro',
    modules: ['SAVINGS', 'LOANS', 'CREDITS'],
    items: [
      {
        label: 'Socios',
        href: '#',
        icon: Users,
        requiresPermission: {
          resource: 'savings:members',
          action: 'read',
        },
        items: [
          {
            label: 'Asociados',
            href: '/dashboard/caja-ahorro/asociados',
            requiresPermission: {
              resource: 'savings:members',
              action: 'read',
            }
          },

          {
            label: 'Estado de Cuentas',
            href: '/dashboard/caja-ahorro/estado-cuenta',
            requiresPermission: {
              resource: 'savings:members',
              action: 'read',
            }
          },
        ],
      },
      {
        label: 'Haberes',
        href: '#',
        icon: Upload,
        // requiresPermission: {
        //   resource: 'savings:assets',
        //   action: 'read',
        // },
        items: [
          {
            label: 'Carga',
            href: '/dashboard/caja-ahorro/carga-haberes',
            requiresPermission: {
              resource: 'savings:contributions',
              action: 'read',
            }
          },
          {
            label: 'Retiros',
            href: '/dashboard/caja-ahorro/retiros',
            requiresPermission: {
              resource: 'savings:withdrawals',
              action: 'read',
            }
          },
          {
            label: 'Liquidacion',
            href: '/dashboard/caja-ahorro/liquidacion',
            requiresPermission: {
              resource: 'savings:liquidations',
              action: 'read',
            }
          },
          {
            label: 'Tipos de Retiros',
            href: '/dashboard/caja-ahorro/tipo-retiros',
            requiresPermission: {
              resource: 'savings:withdrawal-types',
              action: 'read',
            }
          },
        ],
      },
      {
        label: 'Prestamos',
        href: '#',
        icon: HandCoins,
        items: [
          {
            label: 'Gestion',
            href: '/dashboard/caja-ahorro/prestamos',
            requiresPermission: {
              resource: 'portfolio:loans',
              action: 'read',
            }
          },
          {
            label: 'Pagos',
            href: '/dashboard/caja-ahorro/pagos-prestamos',
            requiresPermission: {
              resource: 'portfolio:payments-loans',
              action: 'read',
            }
          },
          {
            label: 'Tipos',
            href: '/dashboard/caja-ahorro/tipo-prestamos',
            requiresPermission: {
              resource: 'portfolio:loans-types',
              action: 'read',
            }
          },
        ],
      },
      {
        label: 'Creditos',
        href: '#',
        icon: CreditCard,
        items: [
          {
            label: 'Gestion',
            href: '/dashboard/caja-ahorro/creditos',
            requiresPermission: {
              resource: 'portfolio:credits',
              action: 'read',
            }
          },
          {
            label: 'Pagos',
            href: '/dashboard/caja-ahorro/pagos-creditos',
            requiresPermission: {
              resource: 'portfolio:payments-credits',
              action: 'read',
            }
          },
          {
            label: 'Tipos',
            href: '/dashboard/caja-ahorro/tipo-creditos',
            requiresPermission: {
              resource: 'portfolio:credits-types',
              action: 'read',
            }
          },
        ],
      },
      {
        label: 'Pagos por Lotes',
        href: '/dashboard/caja-ahorro/pagos-por-lotes',
        icon: Layers,
        requiresPermission: {
          resource: 'savings:contributions',
          action: 'mass_upload',
        }
      },
      {
        label: 'Reportes',
        href: '#',
        icon: FileText,
        items: [
          {
            label: 'Socios y Haberes',
            href: '/dashboard/reportes/socios-haberes',
            requiresPermission: {
              resource: 'savings:contributions',
              action: 'read',
            },
          },
          {
            label: 'Préstamos',
            href: '/dashboard/reportes/prestamos',
            requiresPermission: {
              resource: 'portfolio:loans',
              action: 'read',
            },
          },
          {
            label: 'Créditos',
            href: '/dashboard/reportes/creditos',
            requiresPermission: {
              resource: 'portfolio:credits',
              action: 'read',
            },
          },
        ],
      },
    ],
  },
  {
    label: 'Inventario',
    modules: ['INVENTORY'],
    items: [
      {
        label: 'Categorias',
        href: '/dashboard/inventario/categorias',
        icon: Tag,
        requiresPermission: {
          resource: 'inventory:categories',
          action: 'read',
        },
      },
      {
        label: 'Productos',
        href: '/dashboard/inventario/productos',
        icon: Package,
        requiresPermission: {
          resource: 'inventory:products',
          action: 'read',
        },
      },
      {
        label: 'Servicios',
        href: '/dashboard/inventario/servicios',
        icon: Boxes,
        requiresPermission: {
          resource: 'inventory:services',
          action: 'read',
        },
      },
      {
        label: 'Activos Fijos',
        href: '/dashboard/inventario/activos-fijos',
        icon: ClipboardList,
        requiresPermission: {
          resource: 'inventory:assets',
          action: 'read',
        },
      },
      {
        label: 'Movimientos',
        href: '/dashboard/inventario/movimientos',
        icon: ArrowRightLeft,
        requiresPermission: {
          resource: 'inventory:stock',
          action: 'read',
        },
      },
    ],
  },
  {
    label: 'Compras',
    modules: ['PURCHASING'],
    items: [
      {
        label: 'Proveedores',
        href: '/dashboard/compras/proveedores',
        icon: Users,
        requiresPermission: {
          resource: 'purchasing:suppliers',
          action: 'read',
        },
      },
      {
        label: 'Ordenes de Compra',
        href: '/dashboard/compras/ordenes-compra',
        icon: ShoppingCart,
        requiresPermission: {
          resource: 'purchasing:orders',
          action: 'read',
        },
      },
      {
        label: 'Recepción Facturas',
        href: '/dashboard/compras/facturas',
        icon: Receipt,
        requiresPermission: {
          resource: 'purchasing:invoices',
          action: 'read',
        },
      },
      {
        label: 'Ctas. por Pagar',
        href: '/dashboard/compras/cuentas-por-pagar',
        icon: DollarSign,
        requiresPermission: {
          resource: 'purchasing:accounts_payable',
          action: 'read',
        },
      },

      // {
      //   label: 'Pagos Proveedores',
      //   href: '/dashboard/compras/pagos',
      //   icon: FileText,
      //   // requiresPermission: {
      //   //   resource: 'purchasing:supplier-payments',
      //   //   action: 'read',
      //   // },
      // },
      {
        label: 'Estado de Cuenta',
        href: '/dashboard/compras/estado-cuenta',
        icon: Scale,
        requiresPermission: {
          resource: 'purchasing:suppliers',
          action: 'read',
        },
      },
      {
        label: 'Reportes de Compras',
        href: '/dashboard/compras/reportes',
        icon: BarChart3,
        requiresPermission: {
          resource: 'purchasing:reports',
          action: 'execute',
        },
      },
    ],
  },
  {
    label: 'Bancos',
    modules: ['BANKING'],
    items: [
      {
        label: 'Directorio',
        href: '/dashboard/configuracion/bancos',
        icon: Landmark,
        requiresPermission: {
          resource: 'banking:directory',
          action: 'read',
        },
      },
      {
        label: 'Cuentas Bancarias',
        href: '/dashboard/configuracion/cuentas-bancarias',
        icon: Landmark,
        requiresPermission: {
          resource: 'banking:accounts',
          action: 'read',
        },
      },
      {
        label: 'Mov. Bancarios',
        href: '/dashboard/configuracion/movimientos-bancarios',
        icon: ArrowRightLeft,
        requiresPermission: {
          resource: 'banking:transactions',
          action: 'read',
        },
      },
      {
        label: 'Conciliación',
        href: '/dashboard/configuracion/conciliaciones',
        icon: ArrowRightLeft,
        requiresPermission: {
          resource: 'banking:reconciliations',
          action: 'read',
        },
      },
      {
        label: 'Reportes',
        href: '/dashboard/configuracion/reportes-bancos',
        icon: FileText,
        requiresPermission: {
          resource: 'banking:accounts',
          action: 'read',
        },
      },

    ],
  },
  {
    label: 'Contabilidad',
    modules: ['ACCOUNTING'],
    items: [
      {
        label: 'Catalogo Contable',
        href: '#',
        icon: LayoutDashboard,
        items: [
          {
            label: 'Plan de Cuentas',
            href: '/dashboard/contabilidad/cuentas-contables',
            requiresPermission: {
              resource: 'accounting:chart_of_accounts',
              action: 'read',
            },
          },
          {
            label: 'Ciclos Contables',
            href: '/dashboard/contabilidad/ciclos-contables',
            requiresPermission: {
              resource: 'accounting:cycles',
              action: 'read',
            },
          },
          {
            label: 'Mapa de Integraciones',
            href: '/dashboard/contabilidad/reglas-contables',
            requiresPermission: {
              resource: 'accounting:journal_entries',
              action: 'read',
            },
          },
        ],
      },
      {
        label: 'Operaciones Contables',
        href: '#',
        icon: Users,
        items: [
          {
            label: 'Asientos Contables',
            href: '/dashboard/contabilidad/asientos-contables',
            requiresPermission: {
              resource: 'accounting:journal_entries',
              action: 'read',
            },
          },
          {
            label: 'Saldos Contables',
            href: '/dashboard/contabilidad/saldos-contables',
            requiresPermission: {
              resource: 'accounting:balances',
              action: 'read',
            },
          },
        ],
      },
      {
        label: 'Reportes Contables',
        href: '#',
        icon: FileText,
        items: [
          {
            label: 'Libro Diario',
            href: '/dashboard/contabilidad/reportes?tab=journal-book',
            requiresPermission: {
              resource: 'accounting:reports',
              action: 'read',
            },
          },
          {
            label: 'Libro Mayor',
            href: '/dashboard/contabilidad/reportes?tab=general-ledger',
            requiresPermission: {
              resource: 'accounting:reports',
              action: 'read',
            },
          },
          {
            label: 'Bal. Comprobación',
            href: '/dashboard/contabilidad/reportes?tab=trial-balance',
            requiresPermission: {
              resource: 'accounting:reports',
              action: 'read',
            },
          },
          {
            label: 'Balance General',
            href: '/dashboard/contabilidad/reportes?tab=balance-sheet',
            requiresPermission: {
              resource: 'accounting:reports',
              action: 'read',
            },
          },
          {
            label: 'Est. de Resultados',
            href: '/dashboard/contabilidad/reportes?tab=income-statement',
            requiresPermission: {
              resource: 'accounting:reports',
              action: 'read',
            },
          },
          {
            label: 'Bal. de Asociados',
            href: '/dashboard/contabilidad/reportes?tab=associates-balance',
            requiresPermission: {
              resource: 'accounting:reports',
              action: 'read',
            },
          },
        ],
      },
    ],
  },


  {
    label: 'Administracion',
    items: [
      {
        label: 'Usuarios',
        href: '/dashboard/administracion/usuarios',
        icon: UserCog,
        requiresPermission: {
          resource: 'iam:users',
          action: 'read',
        },
      },
      {
        label: 'Roles y Permisos',
        href: '/dashboard/administracion/roles',
        icon: Shield,
        requiresPermission: {
          resource: 'iam:roles',
          action: 'read',
        },
      },
      {
        label: 'Categorías',
        href: '/dashboard/administracion/categorias',
        icon: Tag,
        requiresPermission: {
          resource: 'catalog:categories',
          action: 'read',
        },
      },
    ],
  },
  {
    label: 'Configuración',
    items: [
      {
        label: 'Parámetros Generales',
        href: '/dashboard/configuracion/parametros-generales',
        icon: Settings,
        requiresPermission: {
          resource: 'system:tenants-systems',
          action: 'read',
        },
      },
      {
        label: 'Parámetros por Módulo',
        href: '/dashboard/configuracion/parametros-modulo',
        icon: Settings,
        requiresPermission: {
          resource: 'system:modules',
          action: 'read',
        },
      },
    ],
  },

  {
    label: 'Sistema',
    items: [
      {
        label: 'Parámetros Plataforma',
        href: '/dashboard/configuracion/parametros-globales',
        icon: Settings,
        requiresPermission: {
          resource: 'system:global',
          action: 'read',
        },
      },
      {
        label: 'Clientes',
        href: '/dashboard/administracion/clientes',
        icon: Building2,
        requiresPermission: {
          resource: 'system:tenants',
          action: 'create',
        },
      },
      {
        label: 'Permisos',
        href: '/dashboard/administracion/permisos',
        icon: Lock,
        requiresPermission: {
          resource: 'iam:permissions',
          action: 'create',
        },
      },
      {
        label: 'Monedas',
        href: '/dashboard/configuracion/monedas',
        icon: Settings,
        requiresPermission: {
          resource: 'system:currencies',
          action: 'read',
        },
      },
    ],
  },
];

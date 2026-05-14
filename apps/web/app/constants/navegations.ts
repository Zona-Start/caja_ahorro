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
} from 'lucide-react';

export interface NavSubItem {
  label: string;
  href: string;
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
    items: [
      {
        label: 'Socios',
        href: '#',
        icon: Users,
        // requiresPermission: {
        //   resource: 'portfolio:credits-types',
        //   action: 'read',
        // },
        items: [
          {
            label: 'Asociados',
            href: '/dashboard/caja-ahorro/asociados',
          },
          {
            label: 'Estado de Cuentas',
            href: '/dashboard/caja-ahorro/estado-cuenta',
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
          },
          {
            label: 'Retiros',
            href: '/dashboard/caja-ahorro/retiros',
          },
          {
            label: 'Liquidacion',
            href: '/dashboard/caja-ahorro/liquidacion',
          },
          {
            label: 'Desembolsos',
            href: '/dashboard/caja-ahorro/desembolsos',
          },
          {
            label: 'Tipos de Retiros',
            href: '/dashboard/caja-ahorro/tipo-retiros',
          },
        ],
      },
      {
        label: 'Prestamos',
        href: '#',
        icon: HandCoins,
        // requiresPermission: {
        //   resource: 'portfolio:credits-types',
        //   action: 'read',
        // },
        items: [
          {
            label: 'Gestion',
            href: '/dashboard/caja-ahorro/prestamos',
          },
          {
            label: 'Pagos',
            href: '/dashboard/caja-ahorro/pagos-prestamos',
          },
          {
            label: 'Tipos',
            href: '/dashboard/caja-ahorro/tipo-prestamos',
          },
        ],
      },
      {
        label: 'Creditos',
        href: '#',
        icon: CreditCard,
        // requiresPermission: {
        //   resource: 'portfolio:credits-types',
        //   action: 'read',
        // },
        items: [
          {
            label: 'Gestion',
            href: '/dashboard/caja-ahorro/creditos',
          },
          {
            label: 'Pagos',
            href: '/dashboard/caja-ahorro/pagos-creditos',
          },
          {
            label: 'Tipos',
            href: '/dashboard/caja-ahorro/tipo-creditos',
          },
        ],
      },
    ],
  },
  {
    label: 'Contabilidad',
    items: [
      {
        label: 'Catalogo Contable',
        href: '#',
        icon: LayoutDashboard,
        items: [
          {
            label: 'Plan de Cuentas',
            href: '/dashboard/contabilidad/cuentas-contables',
          },
          {
            label: 'Ciclos Contables',
            href: '/dashboard/contabilidad/ciclos-contables',
          },
          {
            label: 'Mapa de Integraciones',
            href: '/dashboard/contabilidad/reglas-contables',
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
          },
          {
            label: 'Saldos Contables',
            href: '/dashboard/contabilidad/saldos-contables',
          },
        ],
      },
      {
        label: 'Reportes Contables',
        href: '#',
        icon: Users,
        items: [
          {
            label: 'Libro Diario',
            href: '/dashboard/contabilidad/libro-diario',
          },
          {
            label: 'Mayor General',
            href: '/dashboard/contabilidad/mayor-general',
          },
        ],
      },
    ],
  },
  {
    label: 'Inventario',
    items: [
      {
        label: 'Categorias',
        href: '/dashboard/inventario/categorias',
        icon: Tag,
        // requiresPermission: {
        //   resource: 'inventory:categories',
        //   action: 'read',
        // },
      },
      {
        label: 'Productos',
        href: '/dashboard/inventario/productos',
        icon: Package,
        // requiresPermission: {
        //   resource: 'inventory:products',
        //   action: 'read',
        // },
      },
      {
        label: 'Servicios',
        href: '/dashboard/inventario/servicios',
        icon: Boxes,
        // requiresPermission: {
        //   resource: 'inventory:services',
        //   action: 'read',
        // },
      },
      {
        label: 'Activos Fijos',
        href: '/dashboard/inventario/activos-fijos',
        icon: ClipboardList,
        // requiresPermission: {
        //   resource: 'inventory:fixed_assets',
        //   action: 'read',
        // },
      },
      {
        label: 'Movimientos',
        href: '/dashboard/inventario/movimientos',
        icon: ArrowRightLeft,
        // requiresPermission: {
        //   resource: 'inventory:movements',
        //   action: 'read',
        // },
      },
    ],
  },
  {
    label: 'Compras',
    items: [
      {
        label: 'Proveedores',
        href: '/dashboard/compras/proveedores',
        icon: Users,
        // requiresPermission: {
        //   resource: 'purchasing:suppliers',
        //   action: 'read',
        // },
      },
      {
        label: 'Ordenes de Compra',
        href: '/dashboard/compras/ordenes-compra',
        icon: ShoppingCart,
        // requiresPermission: {
        //   resource: 'purchasing:purchase-orders',
        //   action: 'read',
        // },
      },
      {
        label: 'Ctas. por Pagar',
        href: '/dashboard/compras/cuentas-por-pagar',
        icon: DollarSign,
        // requiresPermission: {
        //   resource: 'purchasing:accounts-payable',
        //   action: 'read',
        // },
      },
      {
        label: 'Facturas',
        href: '/dashboard/compras/facturas',
        icon: Receipt,
        // requiresPermission: {
        //   resource: 'purchasing:supplier-invoices',
        //   action: 'read',
        // },
      },
      {
        label: 'Pagos',
        href: '/dashboard/compras/pagos',
        icon: FileText,
        // requiresPermission: {
        //   resource: 'purchasing:supplier-payments',
        //   action: 'read',
        // },
      },
    ],
  },
  {
    label: 'Administracion',
    items: [
      {
        label: 'Clientes',
        href: '/dashboard/administracion/clientes',
        icon: Building2,
        requiresPermission: {
          resource: 'tenants',
          action: 'read',
        },
      },
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
        label: 'Permisos',
        href: '/dashboard/administracion/permisos',
        icon: Lock,
        requiresPermission: {
          resource: 'iam:permissions',
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
        label: 'Parámetros Globales',
        href: '/dashboard/configuracion/parametros-globales',
        icon: Settings,
        requiresPermission: {
          resource: 'settings',
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
      {
        label: 'Parámetros General',
        href: '/dashboard/configuracion/parametros-generales',
        icon: Settings,
        requiresPermission: {
          resource: 'system:tenants-systems',
          action: 'read',
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
      {
        label: 'Bancos',
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
          resource: 'banking:movements',
          action: 'read',
        },
      },
    ],
  },
];

// src/constants/navegations.ts
import {
  Building2,
  LayoutDashboard,
  Lock,
  LucideIcon,
  Settings,
  Shield,
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
  items?: NavSubItem[]; // Aquí definimos que es opcional
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: 'Gestión',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        label: 'Asociados',
        href: '/members',
        icon: Users,
        // Ahora TS no se quejará de esta propiedad
        items: [{ label: 'Lista', href: '/members/list' }],
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
        // Ahora TS no se quejará de esta propiedad
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
            label: 'Reglas Contables',
            href: '/dashboard/contabilidad/reglas-contables',
          },
        ],
      },
      {
        label: 'Operaciones Contables',
        href: '#',
        icon: Users,
        // Ahora TS no se quejará de esta propiedad
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
    ],
  },
];

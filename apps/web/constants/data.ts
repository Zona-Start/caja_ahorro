import { NavItem } from '@/types';

//Info: The following data is used for the sidebar navigation and Cmd K bar.
export const savingBankItems: NavItem[] = [
  {
    title: 'Socios',
    url: '#',
    icon: 'handshake',
    shortcut: ['s', 's'],
    isActive: false,
    items: [
      {
        title: 'Asociados',
        shortcut: ['l', 'l'],
        url: '/dashboard/socios/asociados',
        icon: 'login',
      },
      {
        title: 'Tipos de Asociados',
        shortcut: ['l', 'l'],
        url: '/dashboard/socios/tipos_asociados',
        icon: 'login',
      },
    ], // No child items
  },
  {
    title: 'Prestamos',
    url: '#', // Placeholder as there is no direct link for the parent
    icon: 'handCoins',
    isActive: false,

    items: [
      {
        title: 'Prestamos Ordinarios',
        url: '#',
        icon: 'userPen',
        shortcut: ['m', 'm'],
      },
      {
        title: 'Refinanciamiento',
        shortcut: ['l', 'l'],
        url: '#',
        icon: 'login',
      },
      {
        title: 'Reintegros',
        shortcut: ['l', 'l'],
        url: '#',
        icon: 'login',
      },
    ],
  },
  {
    title: 'Creditos',
    url: '#', // Placeholder as there is no direct link for the parent
    icon: 'creditCard',
    isActive: false,

    items: [
      {
        title: 'Ordinarios',
        url: '#',
        icon: 'userPen',
        shortcut: ['m', 'm'],
      },
      {
        title: 'Con Cuotas Espciales',
        shortcut: ['l', 'l'],
        url: '#',
        icon: 'login',
      },
    ],
  },
];

export const AccountingItems: NavItem[] = [
  {
    title: 'Plan de Cuentas',
    url: '/dashboard/contabilidad/cuentas_contables',
    icon: 'betweenHorizonalStart',
    shortcut: ['p', 'p'],
    isActive: false,
    items: [], // No child items
  },
];

export const BankItems: NavItem[] = [
  {
    title: 'Directorio de Bancos',
    url: '/dashboard/bancos/tipos-bancos',
    icon: 'landmark',
    shortcut: ['p', 'p'],
    isActive: false,
    items: [], // No child items
  },
  {
    title: 'Movimientos Bancarios',
    url: '#',
    icon: 'receiptText',
    shortcut: ['p', 'p'],
    isActive: false,
    items: [], // No child items
  },
  {
    title: 'Conciliacion Bancaria',
    url: '#',
    icon: 'receiptText',
    shortcut: ['p', 'p'],
    isActive: false,
    items: [], // No child items
  },
];

export const ConfigItems: NavItem[] = [
  {
    title: 'Configuración',
    url: '#', // Placeholder as there is no direct link for the parent
    icon: 'settings',
    isActive: false,
    items: [
      {
        title: 'Datos Caja Ahorro',
        url: '/dashboard/configuraciones/datos-caja-ahorro',
        icon: 'userPen',
        shortcut: ['m', 'm'],
      },
      {
        title: 'Frecuencias de Pagos',
        shortcut: ['l', 'l'],
        url: '/dashboard/configuraciones/frecuencias_pago',
        icon: 'login',
      },
      {
        title: 'Tipos de Trabajadores',
        shortcut: ['l', 'l'],
        url: '/dashboard/configuraciones/tipo_trabajadores',
        icon: 'login',
      },
      {
        title: 'Tipos de Transacciones',
        shortcut: ['l', 'l'],
        url: '/dashboard/configuraciones/tipo_transacciones',
        icon: 'login',
      },
    ],
  },
  {
    title: 'Usuarios del Sistemas',
    url: '#',
    icon: 'usersRound',
    isActive: true,
    items: [],
  },
];

export type Product = {
  name: string;
  description: string;
  created_at: string;
  price: number;
  id: number;
  category: string;
  updated_at: string;
};

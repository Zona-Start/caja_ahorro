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
        title: 'Frecuencias de Pagos',
        shortcut: ['l', 'l'],
        url: '/dashboard/socios/frecuencias-pago',
        icon: 'login',
      },
      {
        title: 'Tipos de Trabajadores',
        shortcut: ['l', 'l'],
        url: '/dashboard/socios/tipo-trabajadores',
        icon: 'login',
      },
      {
        title: 'Tipos de Transacciones',
        shortcut: ['l', 'l'],
        url: '/dashboard/socios/tipo-transacciones',
        icon: 'login',
      },
    ], // No child items
  },
  {
    title: 'Prestamos',
    url: '/dashboard/prestamos', // Placeholder as there is no direct link for the parent
    icon: 'handCoins',
    isActive: false,

    items: [
      {
        title: 'Prestamos Ordinarios',
        url: '/dashboard/prestamos/ordinarios',
        icon: 'userPen',
        shortcut: ['m', 'm'],
      },
      {
        title: 'Tipos Prestamos',
        shortcut: ['l', 'l'],
        url: '/dashboard/prestamos/tipo-prestamos',
        icon: 'login',
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
    title: 'Catálogos',
    url: '#', // Placeholder as there is no direct link for the parent
    icon: 'swatchBook',
    isActive: false,
    items: [
      {
        title: 'Plan de Cuentas',
        url: '/dashboard/contabilidad/cuentas-contables',
        icon: 'userPen',
        shortcut: ['m', 'm'],
      },
      {
        title: 'Cuentas de Asociados',
        shortcut: ['l', 'l'],
        url: '#',
        icon: 'login',
      },
    ],
  },
  {
    title: 'Operaciones',
    url: '#', // Placeholder as there is no direct link for the parent
    icon: 'betweenHorizonalStart',
    isActive: false,
    items: [
      {
        title: 'Asientos Contables',
        url: '#',
        icon: 'userPen',
        shortcut: ['m', 'm'],
      },
      {
        title: 'Libro Diario',
        shortcut: ['l', 'l'],
        url: '#',
        icon: 'login',
      },
      {
        title: 'Libro Mayor',
        shortcut: ['l', 'l'],
        url: '#',
        icon: 'login',
      },
    ],
  },
  {
    title: 'Estados Financieros',
    url: '#', // Placeholder as there is no direct link for the parent
    icon: 'fileChartLine',
    isActive: false,
    items: [
      {
        title: 'Balance Comprobación',
        shortcut: ['l', 'l'],
        url: '#',
        icon: 'login',
      },
      {
        title: 'Balance general',
        shortcut: ['l', 'l'],
        url: '#',
        icon: 'login',
      },
      {
        title: 'Estado de Resultados',
        shortcut: ['l', 'l'],
        url: '#',
        icon: 'login',
      },
    ],
  },
  {
    title: 'Gestión Asociados',
    url: '#', // Placeholder as there is no direct link for the parent
    icon: 'handPlatter',
    isActive: false,
    items: [
      {
        title: 'Balance de Asociados',
        shortcut: ['l', 'l'],
        url: '#',
        icon: 'login',
      },
      {
        title: 'Cuentas de Asociados',
        shortcut: ['l', 'l'],
        url: '#',
        icon: 'login',
      },
    ],
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
    title: 'Cuentas Bancarias',
    url: '#',
    icon: 'wallet',
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
    icon: 'squarePercent',
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
        url: '/dashboard/utilidades/configuraciones/datos-caja-ahorro',
        icon: 'userPen',
        shortcut: ['m', 'm'],
      },
      {
        title: 'Numeración  Documentos',
        shortcut: ['l', 'l'],
        url: '#',
        icon: 'login',
      },
    ],
  },
  {
    title: 'Gestión Usuarios',
    url: '#',
    icon: 'usersRound',
    isActive: true,
    items: [],
  },
  {
    title: 'Propiedades del Sistema',
    url: '/dashboard/utilidades/propiedades-sistema',
    icon: 'tableProperties',
    isActive: true,
    items: [],
  },
  {
    title: 'Respaldos Bade de Datos',
    url: '#',
    icon: 'databaseBackup',
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

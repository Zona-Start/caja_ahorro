import { NavItem } from '@/types';

//Info: The following data is used for the sidebar navigation and Cmd K bar.
export const savingBankItems: NavItem[] = [
  {
    title: 'Asociados',
    url: '/dashboard/product',
    icon: 'product',
    shortcut: ['p', 'p'],
    isActive: false,
    items: [], // No child items
  },
  {
    title: 'Prestamos',
    url: '#', // Placeholder as there is no direct link for the parent
    icon: 'billing',
    isActive: true,

    items: [
      {
        title: 'Profile',
        url: '/dashboard/profile',
        icon: 'userPen',
        shortcut: ['m', 'm'],
      },
      {
        title: 'Login',
        shortcut: ['l', 'l'],
        url: '/',
        icon: 'login',
      },
    ],
  },
  {
    title: 'Creditos',
    url: '#', // Placeholder as there is no direct link for the parent
    icon: 'billing',
    isActive: true,

    items: [
      {
        title: 'Profile',
        url: '/dashboard/profile',
        icon: 'userPen',
        shortcut: ['m', 'm'],
      },
      {
        title: 'Login',
        shortcut: ['l', 'l'],
        url: '/',
        icon: 'login',
      },
    ],
  },
];


export const AccountingItems: NavItem[] = [
  {
    title: 'Cuentas Contables',
    url: '/dashboard/product',
    icon: 'product',
    shortcut: ['p', 'p'],
    isActive: false,
    items: [], // No child items
  },
];

export const BankItems: NavItem[] = [
  {
    title: 'Bancos',
    url: '/dashboard/product',
    icon: 'product',
    shortcut: ['p', 'p'],
    isActive: false,
    items: [], // No child items
  },
  {
    title: 'Conciliacion Bancaria',
    url: '/dashboard/product',
    icon: 'product',
    shortcut: ['p', 'p'],
    isActive: false,
    items: [], // No child items
  },
];




export const ConfigItems: NavItem[] = [
  {
    title: 'Configuraciones',
    url: '#', // Placeholder as there is no direct link for the parent
    icon: 'billing',
    isActive: true,

    items: [
      {
        title: 'Caja Ahorro',
        url: '/dashboard/configuraciones/caja-ahorro',
        icon: 'userPen',
        shortcut: ['m', 'm'],
      },
      {
        title: 'Moneda',
        shortcut: ['l', 'l'],
        url: '/',
        icon: 'login',
      },
    ],
  },
 
];

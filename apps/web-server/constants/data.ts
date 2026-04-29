import { NavItem } from '@/types';

//Info: The following data is used for the sidebar navigation and Cmd K bar.
export const savingBankItems: NavItem[] = [
  {
    title: 'Socios',
    url: '#',
    icon: 'handshake',
    colorIcons: 'blue',
    shortcut: ['s', 's'],
    isActive: false,
    items: [
      {
        title: 'Asociados',
        shortcut: ['l', 'l'],
        url: '/dashboard/socios/asociados',
      },
      {
        title: 'Estado de Cuenta',
        shortcut: ['l', 'l'],
        url: '/dashboard/socios/estado-cuenta',
      },
    ], // No child items
  },
  {
    title: 'Haberes',
    url: '#',
    icon: 'ticketPlus',
    colorIcons: 'green',
    shortcut: ['s', 's'],
    isActive: false,
    items: [
      {
        title: 'Carga Haberes',
        shortcut: ['l', 'l'],
        url: '/dashboard/haberes/carga-haberes',
      },
      // {
      //   title: 'Carga Masiva',
      //   shortcut: ['l', 'l'],
      //   url: '#',
      // },
      {
        title: 'Retiro Parcial',
        shortcut: ['l', 'l'],
        url: '/dashboard/haberes/retiros',
      },
      {
        title: 'Liquidación',
        shortcut: ['l', 'l'],
        url: '/dashboard/haberes/liquidacion',
      },
      {
        title: 'Desembolsos por lotes',
        shortcut: ['l', 'l'],
        url: '/dashboard/haberes/desembolsos-asociados',
      },
    ],
  },

  {
    title: 'Prestamos',
    url: '/dashboard/prestamos', // Placeholder as there is no direct link for the parent
    icon: 'handCoins',
    colorIcons: 'yellow',
    isActive: false,

    items: [
      {
        title: 'Gestión de Prestamos',
        url: '/dashboard/prestamos/gestion',
        shortcut: ['m', 'm'],
      },
      {
        title: 'Gestión de Pagos',
        shortcut: ['l', 'l'],
        url: '/dashboard/prestamos/pagos',
      },
    ],
  },
  {
    title: 'Creditos',
    url: '#', // Placeholder as there is no direct link for the parent
    icon: 'creditCard',
    colorIcons: 'orange',
    isActive: false,

    items: [
      {
        title: 'Gestion de Créditos',
        url: '/dashboard/creditos/gestion',
        shortcut: ['m', 'm'],
      },
      {
        title: 'Gestión de Pagos',
        shortcut: ['l', 'l'],
        url: '/dashboard/creditos/pagos',
      },
    ],
  },
  {
    title: 'Inventarios',
    url: '#',
    icon: 'store',
    shortcut: ['s', 's'],
    isActive: false,
    items: [
      {
        title: 'Categorías',
        shortcut: ['l', 'l'],
        url: '/dashboard/inventarios/categorias',
      },
      {
        title: 'Productos',
        shortcut: ['l', 'l'],
        url: '/dashboard/inventarios/productos',
      },
      {
        title: 'Servicios',
        shortcut: ['l', 'l'],
        url: '/dashboard/inventarios/servicios',
      },
      {
        title: 'Bienes o Activos',
        shortcut: ['l', 'l'],
        url: '/dashboard/inventarios/bienes',
      },
      {
        title: 'Movimientos de Inventario',
        shortcut: ['l', 'l'],
        url: '/dashboard/inventarios/movimientos',
      },
    ], // No child items
  },
  {
    title: 'Compras',
    url: '#',
    icon: 'receiptText',
    shortcut: ['s', 's'],
    isActive: false,
    items: [
      {
        title: 'Proveedores',
        shortcut: ['l', 'l'],
        url: '/dashboard/administracion/proveedores',
      },
      {
        title: 'Ordenes de Compra',
        shortcut: ['l', 'l'],
        url: '/dashboard/administracion/ordenes-compra',
      },
      {
        title: 'Recepción de Facturas',
        shortcut: ['l', 'l'],
        url: '/dashboard/administracion/recepcion-facturas',
      },
      {
        title: 'Cuentas por Pagar',
        shortcut: ['l', 'l'],
        url: '/dashboard/administracion/cuentas-x-pagar',
      },
      {
        title: 'Pagos Proveedores',
        shortcut: ['l', 'l'],
        url: '/dashboard/administracion/pagos-proveedores',
      },
    ], // No child items
  },
  {
    title: 'Reportes',
    url: '#', // Placeholder as there is no direct link for the parent
    icon: 'chartColumnBig',
    colorIcons: 'orange',
    isActive: false,
    items: [
      {
        title: 'Centro Reportes Socios',
        url: '/dashboard/reportes/socios',
        shortcut: ['m', 'm'],
      },
    ],
  },
];

export const AccountingItems: NavItem[] = [
  {
    title: 'Maestros Contables',
    url: '#', // Placeholder as there is no direct link for the parent
    icon: 'swatchBook',
    colorIcons: 'cyan',
    isActive: false,
    items: [
      {
        title: 'Plan de Cuentas',
        url: '/dashboard/contabilidad/cuentas-contables',
        shortcut: ['m', 'm'],
      },
      {
        title: 'Ciclos Contables',
        url: '/dashboard/contabilidad/ciclos-contables',
        shortcut: ['m', 'm'],
      },
      {
        title: 'Reglas Contables',
        shortcut: ['l', 'l'],
        url: '/dashboard/contabilidad/reglas-contables',
      },
    ],
  },
  {
    title: 'Operaciones',
    url: '#', // Placeholder as there is no direct link for the parent
    icon: 'betweenHorizonalStart',
    isActive: false,
    colorIcons: 'red',
    items: [
      {
        title: 'Asientos Contables',
        url: '/dashboard/contabilidad/operaciones/asientos-contables',
        shortcut: ['m', 'm'],
      },
      {
        title: 'Saldos Contables',
        shortcut: ['l', 'l'],
        url: '/dashboard/contabilidad/operaciones/saldos-contables',
      },
    ],
  },
  {
    title: 'Reportes Contables',
    url: '/dashboard/contabilidad/reportes',
    icon: 'fileChartLine',
    isActive: false,
    colorIcons: 'emerald',
    items: [],
  },
  // {
  //   title: 'Gestión Asociados',
  //   url: '#', // Placeholder as there is no direct link for the parent
  //   icon: 'handPlatter',
  //   isActive: false,
  //   colorIcons: 'rose',
  //   items: [
  //     {
  //       title: 'Balance de Asociados',
  //       shortcut: ['l', 'l'],
  //       url: '#',
  //     },
  //     {
  //       title: 'Cuentas de Asociados',
  //       shortcut: ['l', 'l'],
  //       url: '#',
  //     },
  //   ],
  // },
];

export const BankItems: NavItem[] = [
  {
    title: 'Directorio de Bancos',
    url: '/dashboard/bancos/tipos-bancos',
    icon: 'landmark',
    colorIcons: 'teal',
    shortcut: ['p', 'p'],
    isActive: false,
    items: [], // No child items
  },
  {
    title: 'Cuentas Bancarias',
    url: '/dashboard/bancos/cuentas-bancarias',
    icon: 'wallet',
    colorIcons: 'yellow',
    shortcut: ['p', 'p'],
    isActive: false,
    items: [], // No child items
  },
  {
    title: 'Movimientos Bancarios',
    url: '/dashboard/bancos/movimientos-bancarios',
    icon: 'receiptText',
    colorIcons: 'cyan',
    shortcut: ['p', 'p'],
    isActive: false,
    items: [], // No child items
  },
  {
    title: 'Conciliacion Bancaria',
    url: '/dashboard/bancos/conciliacion-bancaria',
    icon: 'squarePercent',
    colorIcons: 'rose',
    shortcut: ['p', 'p'],
    isActive: false,
    items: [], // No child items
  },
];

export const ConfigItems: NavItem[] = [
  {
    title: 'Datos de la Caja de Ahorro',
    url: '/dashboard/utilidades/configuraciones/datos-caja-ahorro',
    icon: 'landmark',
    colorIcons: 'indigo',
    isActive: false,
    items: [],
  },
  {
    title: 'Numeración  Documentos',
    url: '/dashboard/utilidades/configuraciones/numeracion-documentos',
    icon: 'fileDigit',
    colorIcons: 'indigo',
    isActive: false,
    items: [],
  },
  {
    title: 'Catálogos de Socios y Nómina',
    url: '#',
    icon: 'idCard',
    colorIcons: 'indigo',
    isActive: false,
    items: [
      {
        title: 'Tipos de Asociados',
        shortcut: ['l', 'l'],
        url: '/dashboard/socios/tipo-asociados',
      },
      {
        title: 'Tipos de Concepto Nomina',
        shortcut: ['l', 'l'],
        url: '/dashboard/utilidades/configuraciones/tipo-nomina',
      },
      {
        title: 'Frecuencias de Pagos',
        shortcut: ['l', 'l'],
        url: '/dashboard/utilidades/configuraciones/frecuencias-pago',
      },
    ],
  },
  {
    title: 'Catálogos de Haberes',
    url: '#', // Placeholder as there is no direct link for the parent
    icon: 'piggyBank',
    colorIcons: 'indigo',
    isActive: false,
    items: [
      {
        title: 'Tipos de Rétiros',
        shortcut: ['l', 'l'],
        url: '/dashboard/haberes/retiros/tipo-retiros',
      },
    ],
  },
  {
    title: 'Catálogos de Financiamientos',
    url: '#', // Placeholder as there is no direct link for the parent
    icon: 'handCoins',
    colorIcons: 'indigo',
    isActive: false,
    items: [
      {
        title: 'Tipos Prestamos',
        shortcut: ['l', 'l'],
        url: '/dashboard/prestamos/tipo-prestamos',
      },
      {
        title: 'Tipos de Créditos',
        url: '/dashboard/creditos/tipo-creditos',
        shortcut: ['m', 'm'],
      },
    ],
  },
  {
    title: 'Eventos Especiales',
    url: '#', // Placeholder as there is no direct link for the parent
    icon: 'gift',
    colorIcons: 'indigo',
    isActive: false,
    items: [
      {
        title: 'Tipos Jornadas',
        shortcut: ['l', 'l'],
        url: '/dashboard/utilidades/configuraciones/tipo-jornadas',
      },
    ],
  },
  {
    title: 'Gestión Usuarios',
    url: '#',
    icon: 'usersRound',
    colorIcons: 'red',
    isActive: true,
    items: [],
  },
  {
    title: 'Propiedades del Sistema',
    url: '/dashboard/utilidades/propiedades-sistema',
    icon: 'tableProperties',
    colorIcons: 'blue',
    isActive: true,
    items: [],
  },
  // {
  //   title: 'Respaldos Bade de Datos',
  //   url: '#',
  //   icon: 'databaseBackup',
  //   colorIcons: 'amber',
  //   isActive: true,
  //   items: [],
  // },
];

export const useTypeSuppliers = () => {
  const data = [
    {
      id: 1,
      name: 'Inventario Caprebicentenario',
    },
    {
      id: 2,
      name: 'Jornada de Salud',
    },
    {
      id: 3,
      name: 'Inventario de Combos Escolar',
    },
    {
      id: 4,
      name: 'FarmaHogarPlus',
    },
  ];

  return {
    data: data,
  };
};

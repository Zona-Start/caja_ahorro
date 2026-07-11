import { type RouteConfig, index, route } from '@react-router/dev/routes';

const routes: RouteConfig = [
  // Añadimos anotación explícita para evitar ts(2742)
  index('routes/home.tsx'),
  route('login', 'routes/login.tsx'),
  route('logout', 'routes/logout.tsx'),

  route('dashboard', 'layouts/dashboard.tsx', [
    index('routes/dashboard/index.tsx'),
    route('profile', 'routes/dashboard/profile.tsx'),
    route('users', 'routes/dashboard/users.tsx'),

    // ── Módulo Core ──
    route('administracion/clientes', 'routes/dashboard/core/tenants.tsx'),
    route('administracion/usuarios', 'routes/dashboard/core/users.tsx'),
    route('administracion/roles', 'routes/dashboard/core/roles.tsx'),
    route('administracion/permisos', 'routes/dashboard/core/permissions.tsx'),
    route('administracion/categorias', 'routes/dashboard/core/categories.tsx'),

    // ── Módulo de Contabilidad ──
    route(
      'contabilidad/cuentas-contables',
      'routes/dashboard/accounting/accounting-accounts.tsx',
    ),
    route(
      'contabilidad/ciclos-contables',
      'routes/dashboard/accounting/accounting-cycles.tsx',
    ),
    route(
      'contabilidad/reportes',
      'routes/dashboard/accounting/accounting-reports.tsx',
    ),
    route(
      'contabilidad/asientos-contables',
      'routes/dashboard/accounting/accounting-entries.tsx',
    ),
    route(
      'contabilidad/saldos-contables',
      'routes/dashboard/accounting/accounting-balances.tsx',
    ),
    route(
      'contabilidad/reglas-contables',
      'routes/dashboard/accounting/accounting-rules.tsx',
    ),

    // ── Módulo de Caja de Ahorro ──
    route(
      'caja-ahorro/asociados',
      'routes/dashboard/savings/savings-associates.tsx',
    ),
    route(
      'caja-ahorro/estado-cuenta',
      'routes/dashboard/savings/savings-inquiry.tsx',
    ),
    route(
      'caja-ahorro/carga-haberes',
      'routes/dashboard/savings/savings-individual-load.tsx',
    ),
    route(
      'caja-ahorro/liquidacion',
      'routes/dashboard/savings/savings-settlement.tsx',
    ),
    route(
      'caja-ahorro/pagos-por-lotes',
      'routes/dashboard/savings/savings-payment-batch.tsx',
    ),
    route(
      'caja-ahorro/tipo-retiros',
      'routes/dashboard/savings/savings-withdrawal-types.tsx',
    ),
    route(
      'caja-ahorro/retiros',
      'routes/dashboard/savings/savings-withdrawal.tsx',
    ),
    route(
      'caja-ahorro/prestamos',
      'routes/dashboard/savings/savings-loans-management.tsx',
    ),
    route(
      'caja-ahorro/pagos-prestamos',
      'routes/dashboard/savings/savings-loans-paid.tsx',
    ),
    route(
      'caja-ahorro/tipo-prestamos',
      'routes/dashboard/savings/savings-loan-types.tsx',
    ),
    route(
      'caja-ahorro/creditos',
      'routes/dashboard/savings/savings-credits-management.tsx',
    ),
    route(
      'caja-ahorro/pagos-creditos',
      'routes/dashboard/savings/savings-credits-paid.tsx',
    ),
    route(
      'caja-ahorro/tipo-creditos',
      'routes/dashboard/savings/savings-credit-types.tsx',
    ),

    // ── Módulo de Inventario ──
    route(
      'inventario/categorias',
      'routes/dashboard/inventory/inventory-categories.tsx',
    ),
    route(
      'inventario/productos',
      'routes/dashboard/inventory/inventory-products.tsx',
    ),
    route(
      'inventario/servicios',
      'routes/dashboard/inventory/inventory-services.tsx',
    ),
    route(
      'inventario/activos-fijos',
      'routes/dashboard/inventory/inventory-fixed-assets.tsx',
    ),
    route(
      'inventario/movimientos',
      'routes/dashboard/inventory/inventory-movements.tsx',
    ),

    // ── Módulo de Compras ──
    route('compras/proveedores', 'routes/dashboard/purchasing/suppliers.tsx'),
    route(
      'compras/ordenes-compra',
      'routes/dashboard/purchasing/purchase-orders.tsx',
    ),
    route(
      'compras/cuentas-por-pagar',
      'routes/dashboard/purchasing/accounts-payable.tsx',
    ),
    route(
      'compras/facturas',
      'routes/dashboard/purchasing/supplier-invoices.tsx',
    ),
    route('compras/pagos', 'routes/dashboard/purchasing/supplier-payments.tsx'),

    // ── Módulo de Configuración ──
    route(
      'configuracion/parametros-globales',
      'routes/dashboard/configuracion/parametros-globales.tsx',
    ),
    route(
      'configuracion/parametros-modulo',
      'routes/dashboard/configuracion/parametros-modulo.tsx',
    ),
    route(
      'configuracion/parametros-generales',
      'routes/dashboard/configuracion/parametros-generales.tsx',
    ),
    route(
      'configuracion/monedas',
      'routes/dashboard/configuracion/monedas.tsx',
    ),
    route(
      'configuracion/bancos',
      'routes/dashboard/configuracion/bank-directory.tsx',
    ),
    route(
      'configuracion/cuentas-bancarias',
      'routes/dashboard/configuracion/bank-account.tsx',
    ),
    route(
      'configuracion/movimientos-bancarios',
      'routes/dashboard/configuracion/bank-movements.tsx',
    ),
  ]),
];

export default routes;

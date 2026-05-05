import { type RouteConfig, index, route } from '@react-router/dev/routes';

const routes: RouteConfig = [ // Añadimos anotación explícita para evitar ts(2742)
  index('routes/home.tsx'),
  route('login', 'routes/login.tsx'),
  route('logout', 'routes/logout.tsx'),
  
  route('dashboard', 'layouts/dashboard.tsx', [
    index('routes/dashboard/index.tsx'),
    route('profile', 'routes/dashboard/profile.tsx'),
    route('users', 'routes/dashboard/users.tsx'),

   // ── Módulo de Contabilidad ──
    route('contabilidad/cuentas-contables', 'routes/dashboard/accounting/accounting-accounts.tsx'),
    route('contabilidad/ciclos-contables', 'routes/dashboard/accounting/accounting-cycles.tsx'),
    route('contabilidad/reportes', 'routes/dashboard/accounting/accounting-reports.tsx'),
    route('contabilidad/asientos-contables', 'routes/dashboard/accounting/accounting-entries.tsx'),
    route('contabilidad/saldos-contables', 'routes/dashboard/accounting/accounting-balances.tsx'),
    route('contabilidad/reglas-contables', 'routes/dashboard/accounting/accounting-rules.tsx'),

    // ── Módulo de Caja de Ahorro ──
    route('caja-ahorro/asociados', 'routes/dashboard/savings-associates.tsx'),
    route('caja-ahorro/consulta', 'routes/dashboard/savings-inquiry.tsx'),
    route('caja-ahorro/tipo-retiros', 'routes/dashboard/savings-withdrawal-types.tsx'),
    route('caja-ahorro/retiros', 'routes/dashboard/savings-withdrawal.tsx'),
    route('caja-ahorro/retiros/nuevo', 'routes/dashboard/savings-withdrawal-create.tsx'),
  ]),
];

export default routes;

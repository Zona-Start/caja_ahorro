import { useAuthStore } from '@/stores/auth.store';
import { useDashboardStats } from '@/features/dashboard/hooks/use-dashboard-stats';
import type {
  SavingsStats,
  ActiveCycle,
  UpcomingPayable,
  RecentAuditEvent,
} from '@/features/dashboard/services/dashboard-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/shadcn/card';
import { Skeleton } from '@repo/shadcn/skeleton';
import { Badge } from '@repo/shadcn/badge';
import { formatCurrency, formatDbDate } from '@/lib/format-utils';
import {
  Users,
  PiggyBank,
  Landmark,
  FileClock,
  ArrowDownToLine,
  AlertTriangle,
  FileText,
  Receipt,
  Calendar,
  Building2,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Package,
  ShoppingCart,
  ShieldAlert,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';

const CHART_COLORS = {
  active: '#10b981',
  pending: '#f59e0b',
  paid: '#3b82f6',
  purple: '#8b5cf6',
};



function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  description?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {title}
        </CardTitle>
        <div className="bg-muted rounded-md p-1.5">
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-muted-foreground text-xs">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function PendingBadge({ count, label, variant }: { count: number; label: string; variant: 'warning' | 'danger' | 'info' }) {
  const colors = {
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    danger: 'border-red-200 bg-red-50 text-red-700',
    info: 'border-blue-200 bg-blue-50 text-blue-700',
  };
  return (
    <div className={`flex items-center justify-between rounded-lg border px-3 py-2 ${colors[variant]}`}>
      <span className="text-xs font-medium">{label}</span>
      <span className="text-lg font-bold">{count}</span>
    </div>
  );
}

function CycleStatusCard({ cycle }: { cycle: ActiveCycle | null }) {
  if (!cycle) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Estado del Ciclo Contable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <XCircle className="text-muted-foreground size-5" />
            <span className="text-muted-foreground">Sin ciclo contable activo</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const endDate = new Date(cycle.endDate);
  const now = new Date();
  const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-sm font-medium">
            Ciclo Contable Activo
          </CardTitle>
          <CardDescription>{cycle.description}</CardDescription>
        </div>
        <Badge variant="default" className="bg-emerald-100 text-emerald-700">
          {cycle.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {formatDbDate(cycle.startDate)} → {formatDbDate(cycle.endDate)}
          </span>
          {daysLeft >= 0 ? (
            <span className="text-amber-600 font-medium">
              {daysLeft} días restantes
            </span>
          ) : (
            <span className="text-red-600 font-medium">Vencido</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AuditFeed({ events }: { events: RecentAuditEvent[] }) {
  const actionIcons: Record<string, React.ElementType> = {
    create: CheckCircle2,
    update: Activity,
    delete: XCircle,
    login: ArrowUpRight,
    logout: ArrowDownLeft,
    approve: CheckCircle2,
  };

  const actionLabels: Record<string, string> = {
    INSERT: 'Creó',
    UPDATE: 'Actualizó',
    DELETE: 'Eliminó',
    LOGIN: 'Inició sesión',
    LOGOUT: 'Cerró sesión',
    APPROVE: 'Aprobó',
  };

  const typeLabels: Record<string, string> = {
    associate: 'Asociado',
    user: 'Usuario',
    loan: 'Préstamo',
    credit: 'Crédito',
    withdrawal: 'Retiro',
    supplier: 'Proveedor',
    product: 'Producto',
    settings: 'Configuración',
    role: 'Rol',
  };

  return (
    <div className="space-y-3">
      {events.length === 0 ? (
        <p className="text-muted-foreground text-sm">Sin eventos recientes</p>
      ) : (
        events.map((evt) => {
          const Icon = actionIcons[evt.action] ?? Activity;
          return (
            <div
              key={evt.id}
              className="flex items-start gap-3 rounded-lg border p-2"
            >
              <div className="bg-muted mt-0.5 rounded-full p-1">
                <Icon className="size-3" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs">
                  {evt.userFullname && (
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {evt.userFullname}
                    </span>
                  )}{' '}
                  <span className="font-medium">
                    {actionLabels[evt.action] ?? evt.action}
                  </span>{' '}
                  {evt.description ? `: ${evt.description}` : ''}
                </p>
                <p className="text-muted-foreground text-xs">
                  {new Date(evt.createdAt).toLocaleString('es-VE')}
                </p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function PayablesTable({ payables }: { payables: UpcomingPayable[] }) {
  if (payables.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Sin cuentas por pagar próximas a vencer
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-muted-foreground border-b text-left text-xs">
            <th className="pb-2 font-medium">Proveedor</th>
            <th className="pb-2 font-medium">Vencimiento</th>
            <th className="pb-2 text-right font-medium">Monto</th>
          </tr>
        </thead>
        <tbody>
          {payables.map((p) => {
            const due = new Date(p.dueDate);
            const now = new Date();
            const diff = Math.ceil(
              (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            );
            return (
              <tr key={p.id} className="border-b last:border-0">
                <td className="py-2 pr-2">{p.supplierName}</td>
                <td className="py-2 pr-2">
                  <span
                    className={
                      diff <= 3
                        ? 'text-red-600 font-medium'
                        : diff <= 7
                          ? 'text-amber-600'
                          : ''
                    }
                  >
                    {formatDbDate(p.dueDate)}
                  </span>
                </td>
                <td className="py-2 text-right">
                  {formatCurrency(p.remainingAmount, 'VES')}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// function SavingsCharts({ savings }: { savings: SavingsStats }) {
//   const loanData = [
//     { name: 'Activos', value: savings.loans.active, fill: CHART_COLORS.active },
//     { name: 'Pendientes', value: savings.loans.pending, fill: CHART_COLORS.pending },
//     { name: 'Pagados', value: savings.loans.paid, fill: CHART_COLORS.paid },
//   ];

//   const creditData = [
//     { name: 'Activos', value: savings.credits.active, fill: CHART_COLORS.active },
//     { name: 'Pendientes', value: savings.credits.pending, fill: CHART_COLORS.pending },
//     { name: 'Pagados', value: savings.credits.paid, fill: CHART_COLORS.paid },
//   ];

//   return (
//     <div className="grid gap-4 md:grid-cols-2">
//       <Card>
//         <CardHeader>
//           <CardTitle className="text-sm font-medium">Préstamos por Estado</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <ResponsiveContainer width="100%" height={220}>
//             <PieChart>
//               <Pie
//                 data={loanData}
//                 cx="50%"
//                 cy="50%"
//                 innerRadius={55}
//                 outerRadius={85}
//                 paddingAngle={4}
//                 dataKey="value"
//               >
//                 {loanData.map((entry, i) => (
//                   <Cell key={i} fill={entry.fill} />
//                 ))}
//               </Pie>
//               <Tooltip
//                 formatter={(value) => [String(value), 'Cantidad']}
//               />
//               <Legend />
//             </PieChart>
//           </ResponsiveContainer>
//         </CardContent>
//       </Card>
//       <Card>
//         <CardHeader>
//           <CardTitle className="text-sm font-medium">Créditos por Estado</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <ResponsiveContainer width="100%" height={220}>
//             <PieChart>
//               <Pie
//                 data={creditData}
//                 cx="50%"
//                 cy="50%"
//                 innerRadius={55}
//                 outerRadius={85}
//                 paddingAngle={4}
//                 dataKey="value"
//               >
//                 {creditData.map((entry, i) => (
//                   <Cell key={i} fill={entry.fill} />
//                 ))}
//               </Pie>
//               <Tooltip
//                 formatter={(value) => [String(value), 'Cantidad']}
//               />
//               <Legend />
//             </PieChart>
//           </ResponsiveContainer>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
            <CardContent>
              <Skeleton className="mb-1 h-8 w-20" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function DashboardIndex() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError } = useDashboardStats();

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !data) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Card>
          <CardContent className="py-8 text-center">
            <AlertTriangle className="text-muted-foreground mx-auto mb-2 size-8" />
            <p className="text-muted-foreground">
              No se pudieron cargar las estadísticas
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { kpis, pendingRequests, finance, alerts, audit, savings, contributions, inventory, purchasing, banking } = data;
  const isSavings = data.businessType === 'CAJA_AHORRO';

  return (
    <div className="flex flex-col gap-6">
      {/* === FILA 1: KPIs Principales === */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground mt-6">
          Indicadores Clave
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Asociados Activos"
            value={String(kpis.totalActiveAssociates)}
            description="Base activa actual"
            icon={Users}
          />
          <KpiCard
            title="Total Haberes (Ahorros)"
            value={formatCurrency(kpis.totalSavingsBalance, 'VES')}
            description="Disponibilidad total captada"
            icon={PiggyBank}
          />
          <KpiCard
            title="Cartera Préstamos/Créditos"
            value={formatCurrency(kpis.activePortfolioAmount, 'VES')}
            description="Volumen activo de crédito"
            icon={Landmark}
          />
          <KpiCard
            title="Cuentas por Pagar"
            value={formatCurrency(kpis.pendingAccountsPayableAmount, 'VES')}
            description="Compromisos con proveedores"
            icon={FileClock}
          />
        </div>
      </div>

      {/* === FILA 2: Solicitudes Pendientes === */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Solicitudes y Pendientes de Acción
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <ArrowDownToLine className="size-4" />
                Retiros Solicitados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pendingRequests.withdrawals.requestedCount}
              </div>
              <p className="text-muted-foreground text-xs">
                {formatCurrency(pendingRequests.withdrawals.requestedAmount, 'VES')} acumulado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Landmark className="size-4" />
                Préstamos por Aprobar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <PendingBadge
                  count={pendingRequests.loans.requestedCount}
                  label="Solicitados"
                  variant="warning"
                />
                <PendingBadge
                  count={pendingRequests.loans.approvedCount}
                  label="Aprobados sin desembolsar"
                  variant="info"
                />
                <PendingBadge
                  count={pendingRequests.loans.pendingDisbursementCount}
                  label="En lote bancario"
                  variant="danger"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <FileText className="size-4" />
                Asientos en Borrador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pendingRequests.accountingDrafts}
              </div>
              <p className="text-muted-foreground text-xs">
                Comprobantes pendientes por contabilizar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Receipt className="size-4" />
                Facturas de Proveedores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pendingRequests.pendingSupplierInvoices}
              </div>
              <p className="text-muted-foreground text-xs">
                Facturas en Solicitud o Aprobadas
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* === FILA 3: Finanzas y Tesorería === */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Finanzas, Contabilidad y Tesorería
        </h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <CycleStatusCard cycle={finance.activeCycle} />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Saldo en Cuentas Bancarias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(finance.bankBalancesTotal, 'VES')}
              </div>
              <p className="text-muted-foreground text-xs">
                Suma de saldos en cajas y bancos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Evolución Débitos/Créditos del Ciclo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart
                  data={[
                    {
                      name: 'Acumulado',
                      Débitos: finance.cycleBalances.totalDebit,
                      Créditos: finance.cycleBalances.totalCredit,
                    },
                  ]}
                  layout="vertical"
                  margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" hide />
                  <Tooltip
                    formatter={(value) => [
                      formatCurrency(Number(value), 'VES'),
                      undefined,
                    ]}
                  />
                  <Bar dataKey="Débitos" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                  <Bar dataKey="Créditos" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-2 flex justify-between text-xs">
                <span className="flex items-center gap-1">
                  <span className="bg-blue-500 inline-block size-2 rounded-full" /> Débitos
                </span>
                <span className="flex items-center gap-1">
                  <span className="bg-emerald-500 inline-block size-2 rounded-full" /> Créditos
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* === FILA 4: Alertas de Inventario y Proveedores === */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Alertas de Inventario y Proveedores
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Package className="size-4" />
                Productos en Punto Crítico
              </CardTitle>
              <CardDescription>
                Stock bajo o en punto de reorden
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-amber-600">
                  {alerts.lowStockProducts}
                </span>
                <span className="text-muted-foreground text-sm">
                  productos requieren atención
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="size-4" />
                CxP Próximas a Vencer
              </CardTitle>
              <CardDescription>Top 5 vencimientos más cercanos</CardDescription>
            </CardHeader>
            <CardContent>
              <PayablesTable payables={alerts.upcomingPayables} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* === CAJA_AHORRO: Préstamos/Créditos y Charts === */}
      {isSavings && savings && (
        <>
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Resumen de Préstamos y Créditos
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Préstamos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <div className="text-xl font-bold text-emerald-600">{savings.loans.active}</div>
                      <div className="text-muted-foreground text-xs">Activos</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-amber-600">{savings.loans.pending}</div>
                      <div className="text-muted-foreground text-xs">Pendientes</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-blue-600">{savings.loans.paid}</div>
                      <div className="text-muted-foreground text-xs">Pagados</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-purple-600">{savings.loans.total}</div>
                      <div className="text-muted-foreground text-xs">Total</div>
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-3 border-t pt-2 text-center text-xs">
                    Monto total: {formatCurrency(savings.loans.totalAmount, 'VES')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Créditos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <div className="text-xl font-bold text-emerald-600">{savings.credits.active}</div>
                      <div className="text-muted-foreground text-xs">Activos</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-amber-600">{savings.credits.pending}</div>
                      <div className="text-muted-foreground text-xs">Pendientes</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-blue-600">{savings.credits.paid}</div>
                      <div className="text-muted-foreground text-xs">Pagados</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-purple-600">{savings.credits.total}</div>
                      <div className="text-muted-foreground text-xs">Total</div>
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-3 border-t pt-2 text-center text-xs">
                    Monto total: {formatCurrency(savings.credits.totalAmount, 'VES')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* <SavingsCharts savings={savings} /> */}

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Comparativa Préstamos vs Créditos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={[
                      { name: 'Activos', Préstamos: savings.loans.active, Créditos: savings.credits.active },
                      { name: 'Pendientes', Préstamos: savings.loans.pending, Créditos: savings.credits.pending },
                      { name: 'Pagados', Préstamos: savings.loans.paid, Créditos: savings.credits.paid },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Préstamos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Créditos" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* === Inventario y Compras (para todos) === */}
      {/* <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Inventario y Compras
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Productos" value={String(inventory.totalProducts)} icon={Package} />
          <KpiCard title="Servicios" value={String(inventory.totalServices)} icon={ShoppingCart} />
          <KpiCard
            title="Activos Fijos"
            value={String(inventory.totalFixedAssets)}
            icon={Building2}
          />
          <KpiCard
            title="Movimientos de Inventario"
            value={formatCurrency(inventory.totalMovementsAmount, 'VES')}
            description="Monto total"
            icon={BarChart3}
          />
        </div>
      </div> */}

      {/* === Tesorería === */}
      {/* <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Tesorería
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <KpiCard
            title="Entradas Bancarias"
            value={formatCurrency(banking.totalInflow, 'VES')}
            description="Total créditos"
            icon={TrendingUp}
            trend="up"
          />
          <KpiCard
            title="Salidas Bancarias"
            value={formatCurrency(banking.totalOutflow, 'VES')}
            description="Total débitos"
            icon={TrendingDown}
            trend="down"
          />
          <KpiCard
            title="Proveedores"
            value={String(purchasing.totalSuppliers)}
            icon={Building2}
          />
        </div>
      </div> */}

      {/* === FILA 5: Auditoría y Seguridad === */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Auditoría y Seguridad
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <ShieldAlert className="size-4" />
                Seguridad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-3xl font-bold text-red-600">
                    {audit.recentFailedLogins}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Intentos fallidos de login (últimas 24h)
                  </p>
                </div>
                <AlertCircle className="text-red-300 size-10" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Activity className="size-4" />
                Últimas Acciones Registradas
              </CardTitle>
              <CardDescription>Feed de auditoría</CardDescription>
            </CardHeader>
            <CardContent>
              <AuditFeed events={audit.recentEvents} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { useAuthStore } from '@/stores/auth.store';
import { TENANTS_KEYS } from '../../../../tenants/keys/tenants-keys';
import { tenantsService } from '../../../../tenants/services/tenants-service';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { useQuery } from '@tanstack/react-query';
import type { ModuleSettingsFilters } from '../../hooks/use-module-settings-filters';

const MODULE_OPTIONS = [
  { value: 'savings', label: 'Caja de Ahorro' },
  { value: 'portfolio', label: 'Cartera' },
  { value: 'accounting', label: 'Contabilidad' },
  { value: 'banking', label: 'Banca' },
  { value: 'inventory', label: 'Inventario' },
  { value: 'purchasing', label: 'Compras' },
];

export const SUBMODULE_LABELS: Record<string, string> = {
  withdrawals: 'Retiros',
  contributions: 'Haberes',
  liquidations: 'Liquidaciones',
  members: 'Socios',
  liquidation: 'Liquidación',
  loans: 'Préstamos',
  credits: 'Créditos',
  loan_payments: 'Pagos de Préstamos',
  credit_payments: 'Pagos de Créditos',
  movements: 'Movimientos',
  products: 'Productos',
  services: 'Servicios',
  fixed_assets: 'Activos Fijos',
  stock_entries: 'Entradas de Inventario',
  stock_outputs: 'Salidas de Inventario',
  stock_adjustments: 'Ajustes de Inventario',
  suppliers: 'Proveedores',
  purchase_orders: 'Órdenes de Compra',
  purchase_receivings: 'Recepción de Compras',
  purchase_invoices: 'Facturas de Compra',
  bill_payments: 'Pagos a Proveedores',
  bill_advances: 'Anticipos a Proveedores',
  bill_transactions: 'Transacciones de Proveedores',
  credit_notes: 'Notas de Crédito',
  debit_notes: 'Notas de Débito',
  accounts_payables: 'Cuentas por Pagar',
  transactions: 'Transacciones',
  bank_transactions: 'Movimientos Bancarios',
  chart_of_accounts: 'Catálogo de Cuentas',
  payroll: 'Nómina',
  invoices: 'Facturas',
  cash_management: 'Gestión de Caja',
  logs: 'Registros',
  individual_load: 'Carga Individual',
  entries: 'Asientos',
};

interface ModuleSettingsFiltersActionProps {
  filters: ModuleSettingsFilters;
  setFilters: (newFilters: Partial<ModuleSettingsFilters>) => void;
  submoduleOptions?: { value: string; label: string }[];
}

export function ModuleSettingsFiltersAction({
  filters,
  setFilters,
  submoduleOptions = [],
}: ModuleSettingsFiltersActionProps) {
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.isSystemAdmin ?? false;

  const { data: tenantsData } = useQuery({
    queryKey: TENANTS_KEYS.list({}),
    queryFn: () => tenantsService.getAll({ limit: 100 }),
    enabled: isSuperAdmin,
  });

  const tenantOptions =
    tenantsData?.data.map((t) => ({
      value: t.id,
      label: t.name,
    })) ?? [];

  return (
    <div className="flex items-center gap-4 grow">
      <DataTableSearch
        title="Buscar parámetros"
        searchKey="q"
        searchQuery={filters.search || ''}
        setSearchQuery={(q) => setFilters({ search: q })}
        setPage={(p) => setFilters({ page: p })}
      />

      <DataTableFilterBox
        filterKey="module"
        title="Módulo"
        options={MODULE_OPTIONS}
        setFilterValue={(v) =>
          setFilters({ module: v || undefined, page: 1 })
        }
        filterValue={filters.module || ''}
      />

      {submoduleOptions.length > 0 && (
        <DataTableFilterBox
          filterKey="submodule"
          title="Submódulo"
          options={submoduleOptions}
          setFilterValue={(v) =>
            setFilters({ submodule: v || undefined, page: 1 })
          }
          filterValue={filters.submodule || ''}
        />
      )}

      {isSuperAdmin && (
        <DataTableFilterBox
          filterKey="tenantId"
          title="Cliente"
          options={tenantOptions}
          setFilterValue={(v) =>
            setFilters({ tenantId: v || undefined, page: 1 })
          }
          filterValue={filters.tenantId || ''}
        />
      )}
    </div>
  );
}

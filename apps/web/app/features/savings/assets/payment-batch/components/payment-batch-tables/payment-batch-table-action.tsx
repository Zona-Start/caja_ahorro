import { Button } from '@repo/shadcn/button';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { Plus, Sparkles } from 'lucide-react';
import { usePaymentBatchFilters } from '../../hooks/use-payment-batch-filters';
import { usePaymentBatchModalStore } from '../../store/payment-batch-store';
import { paymentBatchStatusOptions } from '../../schemas/payment-batch-options';

export function PaymentBatchTableAction({
  onSpecialCreate,
}: {
  onSpecialCreate?: () => void;
}) {
  const { filters, setFilters } = usePaymentBatchFilters();
  const openCreateModal = usePaymentBatchModalStore(
    (state) => state.openCreateModal,
  );

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por referencia"
          searchKey="search"
          searchQuery={filters.search || ''}
          setSearchQuery={(v: string) =>
            setFilters({ search: v || undefined, page: 1 })
          }
          setPage={(p) => setFilters({ page: p as number })}
        />
        <DataTableFilterBox
          title="Estatus"
          filterKey="status"
          options={paymentBatchStatusOptions}
          filterValue={filters.status || ''}
          setFilterValue={(v) => {
            const value = typeof v === 'function' ? v(filters.status || '') : v;
            return setFilters({ status: value || undefined, page: 1 });
          }}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={onSpecialCreate}>
          <Sparkles className="mr-2 h-4 w-4" /> Pagos Especiales
        </Button>
        <Button size="sm" onClick={openCreateModal}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Lote
        </Button>
      </div>
    </div>
  );
}

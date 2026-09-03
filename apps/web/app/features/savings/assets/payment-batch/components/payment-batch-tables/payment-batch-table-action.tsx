import { Button } from '@repo/shadcn/button';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { Plus } from 'lucide-react';
import { usePaymentBatchFilters } from '../../hooks/use-payment-batch-filters';
import { usePaymentBatchModalStore } from '../../store/payment-batch-store';
import { paymentBatchStatusOptions } from '../../schemas/payment-batch-options';

export function PaymentBatchTableAction() {
  const { filters, setFilters } = usePaymentBatchFilters();
  const { openCreateModal } = usePaymentBatchModalStore();

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
      <Button size="sm" onClick={openCreateModal}>
        <Plus className="mr-2 h-4 w-4" /> Nuevo Lote
      </Button>
    </div>
  );
}

import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import { usePurchaseOrdersFilters } from '../../hooks/use-purchase-orders-filters';
import { ORDER_STATUS_OPTIONS } from '../../schemas/purchase-orders-options';
import { usePurchaseOrdersModalStore } from '../../store/purchase-orders-modal.store';

export function PurchaseOrdersTableAction() {
  const { search, setSearch, setPage, status, setStatus } =
    usePurchaseOrdersFilters();
  const { openModal } = usePurchaseOrdersModalStore();

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <DataTableSearch
        title="Buscar orden"
        searchKey="search"
        searchQuery={search}
        setSearchQuery={setSearch}
        setPage={setPage}
      />

      <DataTableFilterBox
        filterKey="status"
        title="Estado"
        options={ORDER_STATUS_OPTIONS}
        setFilterValue={setStatus}
        filterValue={status}
      />

      <Button onClick={() => openModal('create')} size="sm">
        <Plus className="mr-2 h-4 w-4" /> Nueva Orden
      </Button>
    </div>
  );
}

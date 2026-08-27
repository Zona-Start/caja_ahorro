import { Button } from '@repo/shadcn/button';
import { Input } from '@repo/shadcn/input';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { Plus } from 'lucide-react';
import { usePurchaseOrdersFilters } from '../hooks/use-purchase-orders-filters';
import { useSuppliersForOrder } from '../hooks/use-purchase-orders-queries';
import { usePurchaseOrdersModalStore } from '../store/purchase-orders-modal.store';
import { ORDER_STATUS_OPTIONS } from '../schemas/purchase-orders-options';
import { useAuthStore } from '@/stores/auth.store';

export function PurchaseOrdersHeader() {
  const {
    search, setSearch, status, setStatus, supplierId, setSupplierId,
    startDate, setStartDate, endDate, setEndDate,
  } = usePurchaseOrdersFilters();
  const { data: suppliers } = useSuppliersForOrder();
  const { openModal } = usePurchaseOrdersModalStore();
  const hasPermission = useAuthStore((state) => state.hasPermission);

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-4 flex-wrap">
        <Input
          placeholder="Buscar por N° de orden..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72 md:max-w-sm"
        />
        <DataTableFilterBox
          filterKey="supplierId"
          title="Proveedor"
          options={suppliers?.map((s) => ({ value: s.id, label: s.name })) ?? []}
          setFilterValue={setSupplierId as any}
          filterValue={supplierId}
        />
        <DataTableFilterBox
          filterKey="status"
          title="Estado"
          options={ORDER_STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label }))}
          setFilterValue={setStatus as any}
          filterValue={status}
        />
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Desde"
            className="w-40"
          />
          <span className="text-muted-foreground text-sm">a</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="Hasta"
            className="w-40"
          />
        </div>
      </div>

      {hasPermission("purchasing:orders", "create") && (
        <Button onClick={() => openModal('create')} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Nueva Orden
        </Button>
      )}
    </div>
  );
}

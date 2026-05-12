import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useSuppliersFilters } from '../hooks/use-suppliers-filters';
import { useSuppliersQuery } from '../hooks/use-suppliers-queries';
import { useSuppliersModalStore } from '../store/suppliers-modal.store';
import { suppliersColumns } from './suppliers-tables/columns';
import { SuppliersTableAction } from './suppliers-tables/suppliers-table-action';
import { SuppliersHeader } from './suppliers-header';
import { SuppliersModal } from './suppliers-modal';

export default function SuppliersList() {
  const { filters, setFilters, clearFilters } = useSuppliersFilters();
  const { data, isLoading } = useSuppliersQuery(filters);
  const { openModal } = useSuppliersModalStore();

  if (isLoading) {
    return <DataTableSkeleton columnCount={7} rowCount={filters.limit} />;
  }

  const suppliersData = data?.data || [];

  return (
    <div className="space-y-4">
      <SuppliersHeader />

      <SuppliersTableAction
        filters={filters}
        setFilters={setFilters}
        clearFilters={clearFilters}
        onCreateClick={() => openModal('create')}
      />

      <DataTable
        columns={suppliersColumns}
        data={suppliersData}
        totalItems={data?.meta?.totalItems || 0}
        pageSizeOptions={[10, 20, 30, 50]}
      />

      <SuppliersModal />
    </div>
  );
}

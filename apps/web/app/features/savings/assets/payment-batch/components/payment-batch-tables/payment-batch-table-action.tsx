import { Button } from '@repo/shadcn/button';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import { Link } from 'react-router';
import { usePaymentBatchFilters } from '../../hooks/use-payment-batch-filters';

export function PaymentBatchTableAction() {
  const { filters, setFilters } = usePaymentBatchFilters();

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por referencia"
          searchKey="search"
          searchQuery={filters.search || ''}
          setSearchQuery={(v) => setFilters({ search: v })}
          setPage={(p) => setFilters({ page: p })}
        />
      </div>
      <Link to="/dashboard/caja-ahorro/desembolsos/nuevo">
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" /> Nuevo Lote
        </Button>
      </Link>
    </div>
  );
}

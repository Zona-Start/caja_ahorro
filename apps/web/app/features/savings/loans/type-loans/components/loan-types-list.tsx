import { Button } from '@repo/shadcn/button';
import { Input } from '@repo/shadcn/input';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useLoanTypesFilters } from '../hooks/use-loan-types-filters';
import { useLoanTypesQuery } from '../hooks/use-type-loans-query';
import { columns } from './tables/columns';
import { LoanTypesHeader } from './loan-types-header';
import { LoanTypesModal } from './loan-types-modal';

export default function LoanTypesList() {
  const { filters, setFilters } = useLoanTypesFilters();
  const { data, isLoading } = useLoanTypesQuery(filters);
  const [openModal, setOpenModal] = useState(false);

  if (isLoading) {
    return <DataTableSkeleton columnCount={8} rowCount={filters.limit} />;
  }

  const loanTypesData = data?.data || [];

  return (
    <div className="space-y-4">
      <LoanTypesHeader />

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            placeholder="Buscar tipos de préstamos..."
            value={filters.search || ''}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="w-full sm:w-[300px]"
          />
        </div>

        <Button onClick={() => setOpenModal(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Tipo de Préstamo
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={loanTypesData}
        totalItems={data?.meta?.totalCount || 0}
        pageSizeOptions={[10, 20, 30, 50]}
      />

      <LoanTypesModal
        open={openModal}
        onOpenChange={setOpenModal}
        mode="create"
      />
    </div>
  );
}
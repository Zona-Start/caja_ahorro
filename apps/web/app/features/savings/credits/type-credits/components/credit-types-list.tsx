import { Button } from '@repo/shadcn/button';
import { Input } from '@repo/shadcn/input';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useCreditTypesFilters } from '../hooks/use-credit-types-filters';
import { useCreditTypesQuery } from '../hooks/use-credit-types-query';
import { columns } from './tables/columns';
import { CreditTypesHeader } from './credit-types-header';
import { CreditTypesModal } from './credit-types-modal';

export default function CreditTypesList() {
  const { filters, setFilters } = useCreditTypesFilters();
  const { data, isLoading } = useCreditTypesQuery(filters);
  const [openModal, setOpenModal] = useState(false);

  if (isLoading) {
    return <DataTableSkeleton columnCount={8} rowCount={filters.limit} />;
  }

  const creditTypesData = data?.data || [];

  return (
    <div className="space-y-4">
      <CreditTypesHeader />

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            placeholder="Buscar tipos de créditos..."
            value={filters.search || ''}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="w-full sm:w-[300px]"
          />
        </div>

        <Button onClick={() => setOpenModal(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Tipo de Crédito
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={creditTypesData}
        totalItems={data?.meta?.totalCount || 0}
        pageSizeOptions={[10, 20, 30, 50]}
      />

      <CreditTypesModal
        open={openModal}
        onOpenChange={setOpenModal}
        mode="create"
      />
    </div>
  );
}
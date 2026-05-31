import { Button } from '@repo/shadcn/button';
import { Input } from '@repo/shadcn/input';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useWithdrawalTypesFilters } from '../hooks/use-withdrawal-types-filters';
import { useWithdrawalTypesQuery } from '../hooks/use-withdrawal-types-query';
import { columns } from './withdrawal-types-tables/columns';
import { WithdrawalTypesHeader } from './withdrawal-types-header';
import { WithdrawalTypesModal } from './withdrawal-types-modal';

export default function WithdrawalTypesList() {
  const { filters, setFilters } = useWithdrawalTypesFilters();
  const { data, isLoading } = useWithdrawalTypesQuery(filters);
  const [openModal, setOpenModal] = useState(false);

  const [searchValue, setSearchValue] = useState(filters.search || '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearchValue(filters.search || '');
  }, [filters.search]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters({ search: value || undefined, page: 1 });
    }, 400);
  };

  if (isLoading) {
    return <DataTableSkeleton columnCount={8} rowCount={filters.limit} />;
  }

  const withdrawalTypesData = data?.data || [];

  return (
    <div className="space-y-4">
      <WithdrawalTypesHeader />

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            placeholder="Buscar tipos de retiros..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full sm:w-[300px]"
          />
        </div>

        <Button onClick={() => setOpenModal(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Tipo de Retiro
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={withdrawalTypesData}
        totalItems={data?.meta?.totalCount || 0}
        pageSizeOptions={[10, 20, 30, 50]}
      />

      <WithdrawalTypesModal
        open={openModal}
        onOpenChange={setOpenModal}
        mode="create"
      />
    </div>
  );
}
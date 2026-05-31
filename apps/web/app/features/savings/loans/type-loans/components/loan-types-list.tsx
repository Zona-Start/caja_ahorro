import { Button } from '@repo/shadcn/button';
import { Input } from '@repo/shadcn/input';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLoanTypesFilters } from '../hooks/use-loan-types-filters';
import { useLoanTypesQuery } from '../hooks/use-type-loans-query';
import { columns } from './tables/columns';
import { LoanTypesHeader } from './loan-types-header';
import { LoanTypesModal } from './loan-types-modal';

export default function LoanTypesList() {
  const { filters, setFilters } = useLoanTypesFilters();
  const { data, isLoading } = useLoanTypesQuery(filters);
  const [openModal, setOpenModal] = useState(false);
  const [searchVal, setSearchVal] = useState(filters.search || '');

  // Synchronize local search state with filters.search when filters.search changes externally
  useEffect(() => {
    if ((filters.search || '') !== searchVal) {
      setSearchVal(filters.search || '');
    }
  }, [filters.search]);

  // Debounce the setFilters call when searchVal changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((filters.search || '') !== searchVal) {
        setFilters({ search: searchVal });
      }
    }, 400); // 400ms delay

    return () => clearTimeout(timer);
  }, [searchVal]);

  const loanTypesData = data?.data || [];

  return (
    <div className="space-y-4">
      <LoanTypesHeader />

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            placeholder="Buscar tipos de préstamos..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full sm:w-[300px]"
          />
        </div>

        <Button onClick={() => setOpenModal(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Tipo de Préstamo
        </Button>
      </div>

      {isLoading ? (
        <DataTableSkeleton columnCount={8} rowCount={filters.limit} />
      ) : (
        <DataTable
          columns={columns}
          data={loanTypesData}
          totalItems={data?.meta?.totalCount || 0}
          pageSizeOptions={[10, 20, 30, 50]}
        />
      )}

      <LoanTypesModal
        open={openModal}
        onOpenChange={setOpenModal}
        mode="create"
      />
    </div>
  );
}
'use client';
import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useQueryWithdrawalType } from '../../hooks/use-query-withdrawal';
import { useWithdrawalTableFilters } from './use-withdrawal-filters';

export default function WithdrawalTableAction() {
  const { typeFilter, setTypeFilter, searchQuery, setPage, setSearchQuery } =
    useWithdrawalTableFilters();

  const { data: WithdrawalType } = useQueryWithdrawalType();
  const WITHDRAWAL_TYPE_OPTIONS =
    WithdrawalType?.data?.map((type) => ({
      value: type?.id?.toString() ?? '',
      label: type?.description ?? '',
    })) ?? [];

  return (
    <div className="flex items-center justify-between mt-4 ">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por código"
          searchKey={String(/^\d/.test(searchQuery || ''))}
          searchQuery={searchQuery || ''}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        <DataTableFilterBox
          filterKey="type"
          title="Tipo Retiro"
          options={WITHDRAWAL_TYPE_OPTIONS}
          setFilterValue={setTypeFilter}
          filterValue={typeFilter}
        />
      </div>
      <Link href="/dashboard/haberes/retiros/nuevo">
        <Button size="sm">
          <Plus className="h-4 w-4" /> Nuevo Retiro
        </Button>
      </Link>
    </div>
  );
}

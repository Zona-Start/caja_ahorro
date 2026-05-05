import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useWithdrawalTypesQuery } from '../hooks/use-withdrawal-types-query';
import { columns } from './withdrawal-types-tables/columns';

interface WithdrawalTypesListProps {
  page: number;
  search?: string | null;
  limit: number;
}

export function WithdrawalTypesList({
  page,
  search,
  limit,
}: WithdrawalTypesListProps) {
  const filters = {
    page,
    limit,
    ...(search && { search }),
  };

  const { data, isLoading } = useWithdrawalTypesQuery(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={4} rowCount={limit} />;
  }

  return (
    <DataTable
      columns={columns}
      data={data?.data ?? []}
      totalItems={data?.meta?.totalCount || 0}
      pageSizeOptions={[10, 20, 30, 40, 50]}
    />
  );
}

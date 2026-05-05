import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useWithdrawalsQuery } from '../hooks/use-withdrawal-query';
import { columns } from './withdrawal-tables/columns';

interface WithdrawalListProps {
  page: number;
  search?: string | null;
  limit: number;
  type?: string | null;
  status?: string | null;
}

export function WithdrawalList({
  page,
  search,
  limit,
  type,
  status,
}: WithdrawalListProps) {
  const filters = {
    page,
    limit,
    ...(search && { search }),
    ...(type && { type }),
    ...(status && { status }),
  };

  const { data, isLoading } = useWithdrawalsQuery(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={6} rowCount={limit} />;
  }

  return (
    <DataTable
      columns={columns}
      data={data?.data || []}
      totalItems={data?.meta?.totalCount || 0}
      pageSizeOptions={[10, 20, 30, 40, 50]}
    />
  );
}

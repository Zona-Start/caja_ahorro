import { Card, CardContent } from '@repo/shadcn/card';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useWithdrawalsQuery } from '../../hooks/use-inquiry-query';
import { columns } from './withdrawals-tables/columns';

interface WithdrawalsTabProps {
  id: string;
  page: number;
  setPage: (page: number) => void;
  limit: number;
  setLimit: (limit: number) => void;
}

export function WithdrawalsTab({
  id,
  page,
  setPage,
  limit,
  setLimit,
}: WithdrawalsTabProps) {
  const {
    data: withdrawalsData,
    isLoading,
    isError,
  } = useWithdrawalsQuery(id, { page, limit });

  if (isLoading) return <DataTableSkeleton columnCount={6} />;

  if (isError)
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          Error al cargar los retiros.
        </CardContent>
      </Card>
    );

  return (
    <DataTable
      columns={columns}
      data={withdrawalsData?.data || []}
      totalItems={withdrawalsData?.meta?.totalCount || 0}
      pageSizeOptions={[10, 20, 30, 50]}
      page={page}
      pageSize={limit}
      onPageChange={setPage}
      onPageSizeChange={setLimit}
    />
  );
}

import { Card, CardContent } from '@repo/shadcn/card';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useWithdrawalsQuery } from '../../hooks/use-inquiry-query';
import { columns } from './withdrawals-tables/columns';

interface WithdrawalsTabProps {
  id: number;
  page: number;
  setPage: (page: number) => void;
  limit: number;
}

export function WithdrawalsTab({ id, page, setPage, limit }: WithdrawalsTabProps) {
  const {
    data: withdrawalsData,
    isLoading: withdrawalsLoading,
    isError: withdrawalsIsError,
  } = useWithdrawalsQuery(id, { page, limit });

  if (withdrawalsLoading) return <DataTableSkeleton columnCount={6} />;

  if (withdrawalsIsError)
    return (
      <Card>
        <CardContent className="space-y-2 py-6">
          <p className="text-center text-destructive">Error al cargar los retiros.</p>
        </CardContent>
      </Card>
    );

  return (
    <DataTable
      columns={columns}
      data={withdrawalsData?.data || []}
      totalItems={withdrawalsData?.meta?.totalCount || 0}
      pageSizeOptions={[10, 20, 30, 40, 50]}
    />
  );
}

import { Card, CardContent } from '@repo/shadcn/card';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useTransactionHistoryQuery } from '../../hooks/use-inquiry-query';
import { columns } from './history-tables/columns';

interface HistoryTabProps {
  id: number;
  page: number;
  setPage: (page: number) => void;
  limit: number;
}

export function HistoryTab({ id, page, setPage, limit }: HistoryTabProps) {
  const {
    data: historyData,
    isLoading: historyLoading,
    isError: historyIsError,
  } = useTransactionHistoryQuery(id, { page, limit });

  if (historyLoading) return <DataTableSkeleton columnCount={6} />;

  if (historyIsError)
    return (
      <Card>
        <CardContent className="space-y-2 py-6">
          <p className="text-center text-destructive">Error al cargar el historial de transacciones.</p>
        </CardContent>
      </Card>
    );

  return (
    <DataTable
      columns={columns}
      data={historyData?.data || []}
      totalItems={historyData?.meta?.totalCount || 0}
      pageSizeOptions={[10, 20, 30, 40, 50]}
    />
  );
}

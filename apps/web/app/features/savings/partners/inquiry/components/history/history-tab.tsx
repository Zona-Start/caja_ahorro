import { Card, CardContent } from '@repo/shadcn/card';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useTransactionHistoryQuery } from '../../hooks/use-inquiry-query';
import { columns } from './history-tables/columns';

interface HistoryTabProps {
  id: string;
  page: number;
  setPage: (page: number) => void;
  limit: number;
}

export function HistoryTab({ id, page, setPage, limit }: HistoryTabProps) {
  const {
    data: historyData,
    isLoading,
    isError,
  } = useTransactionHistoryQuery(id, { page, limit });

  if (isLoading) return <DataTableSkeleton columnCount={6} />;

  if (isError)
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          Error al cargar el historial de transacciones.
        </CardContent>
      </Card>
    );

  return (
    <DataTable
      columns={columns}
      data={historyData?.data || []}
      totalItems={historyData?.meta?.totalCount || 0}
      pageSizeOptions={[10, 20, 30, 50]}
    />
  );
}

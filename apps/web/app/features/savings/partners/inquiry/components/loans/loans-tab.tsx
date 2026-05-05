import { Card, CardContent } from '@repo/shadcn/card';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useLoansQuery } from '../../hooks/use-inquiry-query';
import { columns } from './loans-tables/columns';

interface LoansTabProps {
  id: number;
  page: number;
  setPage: (page: number) => void;
  limit: number;
}

export function LoansTab({ id, page, setPage, limit }: LoansTabProps) {
  const {
    data: loansData,
    isLoading: loansLoading,
    isError: loansIsError,
  } = useLoansQuery(id, { page, limit });

  if (loansLoading) return <DataTableSkeleton columnCount={6} />;

  if (loansIsError)
    return (
      <Card>
        <CardContent className="space-y-2 py-6">
          <p className="text-center text-destructive">Error al cargar los préstamos.</p>
        </CardContent>
      </Card>
    );

  return (
    <DataTable
      columns={columns}
      data={loansData?.data || []}
      totalItems={loansData?.meta?.totalCount || 0}
      pageSizeOptions={[10, 20, 30, 40, 50]}
    />
  );
}

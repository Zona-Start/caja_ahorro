import { Card, CardContent } from '@repo/shadcn/card';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useLoansQuery } from '../../hooks/use-inquiry-query';
import { columns } from './loans-tables/columns';

interface LoansTabProps {
  id: string;
  page: number;
  setPage: (page: number) => void;
  limit: number;
}

export function LoansTab({ id, page, setPage, limit }: LoansTabProps) {
  const {
    data: loansData,
    isLoading,
    isError,
  } = useLoansQuery(id, { page, limit });

  if (isLoading) return <DataTableSkeleton columnCount={7} />;

  if (isError)
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          Error al cargar los préstamos.
        </CardContent>
      </Card>
    );

  return (
    <DataTable
      columns={columns}
      data={loansData?.data || []}
      totalItems={loansData?.meta?.totalCount || 0}
      pageSizeOptions={[10, 20, 30, 50]}
    />
  );
}

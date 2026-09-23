import { Card, CardContent } from '@repo/shadcn/card';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useHaberesMovementsQuery } from '../../hooks/use-inquiry-query';
import { columns } from './haberes-tables/columns';

interface HaberesTabProps {
  id: string;
  page: number;
  setPage: (page: number) => void;
  limit: number;
  setLimit: (limit: number) => void;
}

export function HaberesTab({
  id,
  page,
  setPage,
  limit,
  setLimit,
}: HaberesTabProps) {
  const {
    data: haberesData,
    isLoading: haberesLoading,
    isError,
  } = useHaberesMovementsQuery(id, { page, limit });

  if (haberesLoading) return <DataTableSkeleton columnCount={4} />;

  if (isError) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          Error al cargar los movimientos de haberes.
        </CardContent>
      </Card>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={haberesData?.data || []}
      totalItems={haberesData?.meta?.totalCount || 0}
      pageSizeOptions={[10, 20, 30, 50]}
      page={page}
      pageSize={limit}
      onPageChange={setPage}
      onPageSizeChange={setLimit}
    />
  );
}

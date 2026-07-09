import { Card, CardContent } from '@repo/shadcn/card';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useCreditsQuery } from '../../hooks/use-inquiry-query';
import { columns } from './credits-tables/columns';

interface CreditsTabProps {
  id: string;
  page: number;
  setPage: (page: number) => void;
  limit: number;
}

export function CreditsTab({ id, page, setPage, limit }: CreditsTabProps) {
  const {
    data: creditsData,
    isLoading,
    isError,
  } = useCreditsQuery(id, { page, limit });

  if (isLoading) return <DataTableSkeleton columnCount={7} />;

  if (isError)
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          Error al cargar los créditos.
        </CardContent>
      </Card>
    );

  return (
    <DataTable
      columns={columns}
      data={creditsData?.data || []}
      totalItems={creditsData?.meta?.totalCount || 0}
      pageSizeOptions={[10, 20, 30, 50]}
    />
  );
}

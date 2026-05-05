import { Card, CardContent } from '@repo/shadcn/card';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useCreditsQuery } from '../../hooks/use-inquiry-query';
import { columns } from './credits-tables/columns';

interface CreditsTabProps {
  id: number;
  page: number;
  setPage: (page: number) => void;
  limit: number;
}

export function CreditsTab({ id, page, setPage, limit }: CreditsTabProps) {
  const {
    data: creditsData,
    isLoading: creditsLoading,
    isError: creditsIsError,
  } = useCreditsQuery(id, { page, limit });

  if (creditsLoading) return <DataTableSkeleton columnCount={6} />;

  if (creditsIsError)
    return (
      <Card>
        <CardContent className="space-y-2 py-6">
          <p className="text-center text-destructive">Error al cargar los créditos.</p>
        </CardContent>
      </Card>
    );

  return (
    <DataTable
      columns={columns}
      data={creditsData?.data || []}
      totalItems={creditsData?.meta?.totalCount || 0}
      pageSizeOptions={[10, 20, 30, 40, 50]}
    />
  );
}

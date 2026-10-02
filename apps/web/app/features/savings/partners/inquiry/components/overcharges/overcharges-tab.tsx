import { Card, CardContent } from '@repo/shadcn/card';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useOverchargeMovementsQuery } from '../../hooks/use-inquiry-query';
import { columns } from './overcharges-tables/columns';

interface OverchargesTabProps {
  id: string;
  movementType: string;
  errorLabel: string;
  page: number;
  setPage: (page: number) => void;
  limit: number;
  setLimit: (limit: number) => void;
}

export function OverchargesTab({
  id,
  movementType,
  errorLabel,
  page,
  setPage,
  limit,
  setLimit,
}: OverchargesTabProps) {
  const {
    data: overchargesData,
    isLoading,
    isError,
  } = useOverchargeMovementsQuery(id, movementType, { page, limit });

  if (isLoading) return <DataTableSkeleton columnCount={6} />;

  if (isError)
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          {errorLabel}
        </CardContent>
      </Card>
    );

  return (
    <DataTable
      columns={columns}
      data={overchargesData?.data || []}
      totalItems={overchargesData?.meta?.totalCount || 0}
      pageSizeOptions={[10, 20, 30, 50]}
      page={page}
      pageSize={limit}
      onPageChange={setPage}
      onPageSizeChange={setLimit}
    />
  );
}

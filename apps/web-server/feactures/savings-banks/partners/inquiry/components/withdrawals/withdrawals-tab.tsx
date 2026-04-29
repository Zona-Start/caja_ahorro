'use client';

import { Card, CardContent } from '@repo/shadcn/components/ui/card';
import { DataTable } from '@repo/shadcn/components/ui/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/components/ui/table/data-table-skeleton';
import { useWithdrawals } from '../../hooks/use-inquiry-queries';
import { columns } from './withdrawals-tables/columns';

interface WithdrawalsTabProps {
  id: number;
  page: number;
  setPage: (page: number) => void;
  limit: number;
}

const AuxiliarComponents = ({
  text,
  color,
}: {
  text: string;
  color?: string;
}) => {
  return (
    <Card>
      <CardContent className="space-y-2">
        <p className={color ? text : 'text-center mt-6'}>{text}</p>
      </CardContent>
    </Card>
  );
};

export function WithdrawalsTab({
  id,
  page,
  setPage,
  limit,
}: WithdrawalsTabProps) {
  const {
    data: withdrawalsData,
    isLoading: withdrawalsLoading,
    isError: withdrawalsIsError,
  } = useWithdrawals(
    { associateId: id, page, limit },
    { enabled: Boolean(id) },
  );

  if (withdrawalsLoading) return <DataTableSkeleton columnCount={5} />;
  if (withdrawalsIsError)
    return (
      <AuxiliarComponents
        text="Error al cargar los retiros."
        color="text-red-500"
      />
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

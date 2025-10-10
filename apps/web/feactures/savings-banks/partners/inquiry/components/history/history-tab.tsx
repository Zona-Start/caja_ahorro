'use client';

import { Card, CardContent } from '@repo/shadcn/components/ui/card';
import { DataTable } from '@repo/shadcn/components/ui/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/components/ui/table/data-table-skeleton';
import { useTransactionHistory } from '../../hooks/use-inquiry-queries';
import { columns } from './history-tables/columns';

interface HistoryTabProps {
  id: number;
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

export function HistoryTab({ id }: HistoryTabProps) {
  const {
    data: historyData,
    isLoading: historyLoading,
    isError: historyIsError,
  } = useTransactionHistory(id, { enabled: Boolean(id) });

  if (historyLoading) return <DataTableSkeleton columnCount={5} />;
  if (historyIsError)
    return (
      <AuxiliarComponents
        text="Error al cargar el historial."
        color="text-red-500"
      />
    );

  return (
    <DataTable
      columns={columns}
      data={historyData?.data || []}
      totalItems={historyData?.data.length || 0}
    />
  );
}

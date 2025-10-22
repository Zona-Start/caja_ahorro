'use client';

import { Card, CardContent } from '@repo/shadcn/components/ui/card';
import { DataTable } from '@repo/shadcn/components/ui/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/components/ui/table/data-table-skeleton';
import { useHaberesMovements } from '../../hooks/use-inquiry-queries';
import { columns } from './haberes-tables/columns';

interface HaberesTabProps {
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

export function HaberesTab({ id, page, setPage, limit }: HaberesTabProps) {
  const {
    data: haberesData,
    isLoading: haberesLoading,
    isError: haberesIsError,
  } = useHaberesMovements(
    { associateId: id, page, limit },
    { enabled: Boolean(id) },
  );

  if (haberesLoading) return <DataTableSkeleton columnCount={4} />;
  if (haberesIsError)
    return (
      <AuxiliarComponents
        text="Error al cargar los movimientos de haberes."
        color="text-red-500"
      />
    );

  return (
    <DataTable
      columns={columns}
      data={haberesData?.data || []}
      totalItems={haberesData?.meta?.totalCount || 0}
      pageSizeOptions={[10, 20, 30, 40, 50]}
    />
  );
}

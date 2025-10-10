'use client';

import { Card, CardContent } from '@repo/shadcn/components/ui/card';
import { DataTable } from '@repo/shadcn/components/ui/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/components/ui/table/data-table-skeleton';
import { useLoans } from '../../hooks/use-inquiry-queries';
import { columns } from './loans-tables/columns';

interface LoansTabProps {
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

export function LoansTab({ id }: LoansTabProps) {
  const {
    data: loansData,
    isLoading: loansLoading,
    isError: loansIsError,
  } = useLoans(id, { enabled: Boolean(id) });

  if (loansLoading) return <DataTableSkeleton columnCount={6} />;
  if (loansIsError)
    return (
      <AuxiliarComponents
        text="Error al cargar los préstamos."
        color="text-red-500"
      />
    );

  return (
    <DataTable
      columns={columns}
      data={loansData?.data || []}
      totalItems={loansData?.data.length || 0}
    />
  );
}

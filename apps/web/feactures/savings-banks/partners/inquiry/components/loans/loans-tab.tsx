'use client';

import { Card, CardContent } from '@repo/shadcn/components/ui/card';
import { DataTable } from '@repo/shadcn/components/ui/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/components/ui/table/data-table-skeleton';
import { useLoans } from '../../hooks/use-inquiry-queries';
import { columns } from './loans-tables/columns';

interface LoansTabProps {
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

export function LoansTab({ id, page, setPage, limit }: LoansTabProps) {
  const {
    data: loansData,
    isLoading: loansLoading,
    isError: loansIsError,
  } = useLoans({ associateId: id, page, limit }, { enabled: Boolean(id) });

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
      totalItems={loansData?.meta?.totalCount || 0}
      pageSizeOptions={[10, 20, 30, 40, 50]}
    />
  );
}

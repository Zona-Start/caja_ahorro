'use client';

import { Card, CardContent } from '@repo/shadcn/components/ui/card';
import { DataTable } from '@repo/shadcn/components/ui/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/components/ui/table/data-table-skeleton';
import { useCredits } from '../../hooks/use-inquiry-queries';
import { columns } from './credits-tables/columns';

interface CreditsTabProps {
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

export function CreditsTab({ id, page, setPage, limit }: CreditsTabProps) {
  const {
    data: creditsData,
    isLoading: creditsLoading,
    isError: creditsIsError,
  } = useCredits({ associateId: id, page, limit }, { enabled: Boolean(id) });

  if (creditsLoading) return <DataTableSkeleton columnCount={6} />;
  if (creditsIsError)
    return (
      <AuxiliarComponents
        text="Error al cargar los créditos."
        color="text-red-500"
      />
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

'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { columns } from './settlement-tables/columns';

interface SettlementtListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
  initialType?: string | null;
}

export default function SettlementList({
  initialPage,
  initialSearch,
  initialLimit,
  initialType,
}: SettlementtListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
    ...(initialType && { type: initialType }),
  };

  // const { data, isLoading } = useQueryWithdrawal(filters);

  // if (isLoading) {
  //   return <DataTableSkeleton columnCount={6} rowCount={initialLimit} />;
  // }

  return (
    <DataTable
      columns={columns}
      data={[]}
      totalItems={0}
      pageSizeOptions={[10, 20, 30, 40, 50]}
    />
  );
}

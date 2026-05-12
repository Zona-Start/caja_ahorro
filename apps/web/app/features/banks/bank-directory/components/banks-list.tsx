import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useBanksQuery } from '../hooks/use-banks-querys';
import { banksColumns } from './banks-tables/columns';

export default function BanksList() {
  const { data, isLoading } = useBanksQuery();

  if (isLoading) {
    return <DataTableSkeleton columnCount={5} rowCount={10} />;
  }

  const banksData = data?.data || [];

  return (
    <DataTable
      columns={banksColumns}
      data={banksData}
      totalItems={banksData.length}
      pageSizeOptions={[10, 20, 30, 50]}
    />
  );
}

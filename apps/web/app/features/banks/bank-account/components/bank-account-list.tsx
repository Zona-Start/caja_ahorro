import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useBankAccountAll } from '../hooks/use-bank-account-query';
import { columns } from './bank-account-tables/columns';

export default function BankAccountList() {
  const { data, isLoading } = useBankAccountAll();

  if (isLoading) {
    return <DataTableSkeleton columnCount={8} rowCount={10} />;
  }

  const bankAccountsData = data?.data || [];

  return (
    <DataTable
      columns={columns}
      data={bankAccountsData}
      totalItems={bankAccountsData.length}
      pageSizeOptions={[10, 20, 30, 50]}
    />
  );
}

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useBankReconciliationFilters } from '../hooks/use-bank-reconciliation-filters';
import { useBankReconciliationsQuery } from '../hooks/use-bank-reconciliation-query';
import { bankReconciliationColumns } from './bank-reconciliation-table/columns';

export default function BankReconciliationList() {
  const { filters } = useBankReconciliationFilters();
  const { data, isLoading } = useBankReconciliationsQuery(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={7} rowCount={filters.limit} />;
  }

  const reconciliationData = data?.data || [];

  return (
    <DataTable
      columns={bankReconciliationColumns}
      data={reconciliationData}
      totalItems={data?.meta?.totalItems || 0}
      pageSizeOptions={[10, 20, 30, 50]}
    />
  );
}

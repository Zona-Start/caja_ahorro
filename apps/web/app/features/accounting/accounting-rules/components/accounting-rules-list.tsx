import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useAccountingRules } from '../hooks/use-accounting-rules-query';
import type { AccountingRule } from '../schemas/accounting-rule.schema';
import { columns } from './tables/columns';

interface AccountingRulesListProps {
  initialSearch?: string | null;
}

export default function AccountingRulesList({
  initialSearch,
}: AccountingRulesListProps) {
  const { data, isLoading } = useAccountingRules({});

  let filteredData: AccountingRule[] = data?.data || [];

  if (initialSearch) {
    filteredData = filteredData.filter(
      (item) =>
        item.operationType
          ?.toLowerCase()
          .includes(initialSearch.toLowerCase()) ||
        item.description?.toLowerCase().includes(initialSearch.toLowerCase()),
    );
  }

  if (isLoading) {
    return <DataTableSkeleton columnCount={6} rowCount={10} />;
  }

  return (
    <DataTable
      columns={columns}
      data={filteredData}
      totalItems={filteredData.length}
    />
  );
}

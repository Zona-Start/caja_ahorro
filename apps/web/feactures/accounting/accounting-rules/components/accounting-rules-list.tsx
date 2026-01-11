'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useAccountingRules } from '../hooks/use-query-accounting-rules';
import { AccountingRule } from '../schemas/accounting-rule.schema';
import { columns } from './tables/columns';

interface AccountingRulesListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
}

export default function AccountingRulesList({
  initialPage,
  initialSearch,
  initialLimit,
}: AccountingRulesListProps) {
  // As the current backend might not support pagination/search yet fully or the hook is simple,
  // we use the simple one. But normally we should pass filters.
  // The current hook useAccountingRules only takes companyId.
  // Let's assume companyId=1 for now as per other forms, or it should come from context/props.
  const companyId = 1;

  const { data, isLoading } = useAccountingRules(companyId);

  // In-memory filtering if API doesn't support it yet, or pass to API if updated.
  // Assuming API returns all for now.
  let filteredData: AccountingRule[] =
    (data as unknown as AccountingRule[]) || [];

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
    return <DataTableSkeleton columnCount={4} rowCount={10} />;
  }

  return (
    <DataTable
      columns={columns}
      data={filteredData}
      totalItems={filteredData.length}
      // If not server-paginated, local pagination is handled by DataTable if configured,
      // or we just show all.
    />
  );
}

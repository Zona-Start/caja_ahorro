import { searchParamsCache } from '@/feactures/accounting/accounting-entries/utils/searchparams';
import { AccountingEntryHeader } from '@/feactures/accounting/accounting-entries/components/accounting-entry-header';
import AccountingEntryList from '@/feactures/accounting/accounting-entries/components/accounting-entry-list';
import AccountingEntryTableAction from '@/feactures/accounting/accounting-entries/components/tables/accounting-entry-table-action';

export default function AccountingEntriesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const { page, limit, q, status, accountingCycleId } = searchParamsCache.parse(searchParams);

  return (
    <div className="space-y-4">
      <AccountingEntryHeader />
      <AccountingEntryTableAction />
      <AccountingEntryList
        initialPage={page}
        initialLimit={limit}
        initialSearch={q}
        initialStatus={status}
        initialCycleId={accountingCycleId}
      />
    </div>
  );
}

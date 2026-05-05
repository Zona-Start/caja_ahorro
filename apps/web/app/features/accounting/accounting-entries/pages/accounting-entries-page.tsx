import PageContainer from '@/components/shared/page-container';
import { AccountingEntryHeader } from '../components/accounting-entry-header';
import AccountingEntryList from '../components/accounting-entry-list';
import AccountingEntryTableAction from '../components/tables/accounting-entry-table-action';

export default function AccountingEntriesPage() {
  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <AccountingEntryHeader />
        <AccountingEntryTableAction />
        <AccountingEntryList />
      </div>
    </PageContainer>
  );
}

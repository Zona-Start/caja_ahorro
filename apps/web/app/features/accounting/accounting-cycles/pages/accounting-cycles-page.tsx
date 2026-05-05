import PageContainer from '@/components/shared/page-container';
import { AccountingCycleHeader } from '../components/accounting-cycle-header';
import AccountingCycleList from '../components/accounting-cycle-list';
import AccountingCycleTableAction from '../components/tables/accounting-cycle-table-action';

export default function AccountingCyclesPage() {
  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <AccountingCycleHeader />
        <AccountingCycleTableAction />
        <AccountingCycleList />
      </div>
    </PageContainer>
  );
}

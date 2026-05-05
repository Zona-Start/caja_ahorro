import PageContainer from '@/components/shared/page-container';
import { useAccountingRulesFilters } from '../hooks/use-accounting-rules-filters';
import { AccountingRuleHeader } from '../components/accounting-rule-header';
import AccountingRuleTableAction from '../components/tables/accounting-rule-table-action';
import AccountingRulesList from '../components/accounting-rules-list';
import { Separator } from '@repo/shadcn/separator';

export default function AccountingRulesPage() {
  const { searchQuery } = useAccountingRulesFilters();

  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-4">
        <AccountingRuleHeader />
        <Separator />
        <AccountingRuleTableAction />
        <AccountingRulesList initialSearch={searchQuery} />
      </div>
    </PageContainer>
  );
}

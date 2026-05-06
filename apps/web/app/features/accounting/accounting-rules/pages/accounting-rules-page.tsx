import { Separator } from '@repo/shadcn/separator';
import { AccountingRuleHeader } from '../components/accounting-rule-header';
import AccountingRulesList from '../components/accounting-rules-list';
import AccountingRuleTableAction from '../components/tables/accounting-rule-table-action';
import { useAccountingRulesFilters } from '../hooks/use-accounting-rules-filters';

export default function AccountingRulesPage() {
  const { searchQuery } = useAccountingRulesFilters();

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <AccountingRuleHeader />
      <Separator />
      <AccountingRuleTableAction />
      <AccountingRulesList initialSearch={searchQuery} />
    </div>
  );
}

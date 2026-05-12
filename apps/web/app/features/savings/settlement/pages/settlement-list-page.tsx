import { Separator } from '@repo/shadcn/separator';
import { SettlementHeader } from '../components/settlement-header';
import { SettlementList } from '../components/settlement-list';
import { SettlementTableAction } from '../components/settlement-tables/settlement-table-action';
import { useWithdrawalTableFilters } from '../components/settlement-tables/use-settlement-filters';

export function SettlementListPage() {
  const { filters } = useWithdrawalTableFilters();

  return (
    <div className="space-y-4">
      <SettlementHeader />
      <Separator />
      <SettlementTableAction />
      <SettlementList
        page={filters.page}
        search={filters.search}
        limit={filters.limit}
      />
    </div>
  );
}

export default SettlementListPage;

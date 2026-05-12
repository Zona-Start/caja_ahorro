import { Separator } from '@repo/shadcn/separator';
import { WithdrawalHeader } from '../components/withdrawal-header';
import { WithdrawalList } from '../components/withdrawal-list';
import { WithdrawalTableAction } from '../components/withdrawal-tables/withdrawal-table-action';
import { useWithdrawalFilters } from '../hooks/use-withdrawal-filters';

export function WithdrawalPage() {
  const { filters } = useWithdrawalFilters();

  return (
    <div className="space-y-4">
      <WithdrawalHeader />
      <Separator />
      <WithdrawalTableAction />
      <WithdrawalList
        page={filters.page}
        search={filters.search}
        limit={filters.limit}
        type={filters.type}
        status={filters.status}
      />
    </div>
  );
}

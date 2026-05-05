import { PageContainer } from '@/components/shared/page-container';
import { Separator } from '@repo/shadcn/separator';
import { WithdrawalTypesHeader } from '../components/withdrawal-types-header';
import { WithdrawalTypesTableAction } from '../components/withdrawal-types-tables/withdrawal-types-table-action';
import { WithdrawalTypesList } from '../components/withdrawal-types-list';
import { useWithdrawalTypesFilters } from '../hooks/use-withdrawal-types-filters';

export function WithdrawalTypesPage() {
  const { filters } = useWithdrawalTypesFilters();

  return (
    <PageContainer>
      <div className="space-y-4">
        <WithdrawalTypesHeader />
        <Separator />
        <WithdrawalTypesTableAction />
        <WithdrawalTypesList
          page={filters.page}
          search={filters.search}
          limit={filters.limit}
        />
      </div>
    </PageContainer>
  );
}

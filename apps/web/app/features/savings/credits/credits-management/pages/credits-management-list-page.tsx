import { Separator } from '@repo/shadcn/separator';
import { OrdinaryCreditsHeader } from '../components/ordinary-credits-header';
import { OrdinaryCreditsList } from '../components/ordinary-credits-list';
import { OrdinaryCreditsTableAction } from '../components/credits-tables/ordinary-credits-table-action';
import { useCreditsFilters } from '../hooks/use-credits-filters';

export function CreditsManagementListPage() {
  const { filters } = useCreditsFilters();

  return (
    <div className="space-y-4">
      <OrdinaryCreditsHeader />
      <Separator />
      <OrdinaryCreditsTableAction />
      <OrdinaryCreditsList
        page={filters.page}
        search={filters.search}
        limit={filters.limit}
        status={filters.status}
        type={filters.type}
        modality={filters.modality}
      />
    </div>
  );
}

export default CreditsManagementListPage;

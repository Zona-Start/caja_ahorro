'use client';

import { ContributionBatchesHeader } from '../components/contribution-batches-header';
import { ContributionBatchesTableAction } from '../components/contribution-batches-table/contribution-batches-table-action';
import { ContributionBatchesList } from '../components/contribution-batches-list';
import { useContributionBatchesFilters } from '../hooks/use-contribution-batches-filters';
import { useQueryContributionBatches } from '../hooks/use-contribution-batches-query';

export default function ContributionBatchesPage() {
  const { filters, setFilters } = useContributionBatchesFilters();
  const { data } = useQueryContributionBatches(filters);

  return (
    <div className="space-y-4">
      <ContributionBatchesHeader
        totalItems={data?.meta?.totalCount ?? 0}
      />
      <ContributionBatchesTableAction
        filters={filters}
        setFilters={setFilters}
      />
      <ContributionBatchesList filters={filters} />
    </div>
  );
}

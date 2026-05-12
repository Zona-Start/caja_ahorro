'use client';

import { LoansHeader } from '../components/ordinary-loans-header';
import { LoansTableAction } from '../components/loans-tables/ordinary-loans-table-action';
import { OrdinaryLoansList } from '../components/ordinary-loans-list';
import { useLoansFilters } from '../hooks/use-loans-filters';

export default function LoansManagementListPage() {
  const { filters, setFilters } = useLoansFilters();

  return (
    <div className="space-y-4">
      <LoansHeader />
      <LoansTableAction filters={filters} setFilters={setFilters} />
      <OrdinaryLoansList
        page={filters.page}
        limit={filters.limit}
        search={filters.search}
        status={filters.status}
        type={filters.type}
        modality={filters.modality}
      />
    </div>
  );
}

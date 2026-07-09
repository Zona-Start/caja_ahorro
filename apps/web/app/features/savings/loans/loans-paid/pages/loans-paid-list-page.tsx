'use client';

import { useState } from 'react';
import { LoansPaidHeader } from '../components/loans-paid-header';
import { LoansPaidList } from '../components/loans-paid-list';
import { LoansPaidTableAction } from '../components/loans-paid-tables/loans-paid-table-action';
import { LoanPaidCreateModal } from '../components/loan-paid-create-modal';
import { useLoansPaidFilters } from '../hooks/use-loans-paid-filters';

export default function LoansPaidListPage() {
  const { filters } = useLoansPaidFilters();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  return (
    <div className="space-y-4">
      <LoansPaidHeader />
      <LoansPaidTableAction onCreateClick={() => setCreateModalOpen(true)} />
      <LoansPaidList
        page={filters.page}
        search={filters.search}
        limit={filters.limit}
        bank={filters.bank}
        type={filters.type}
        method={filters.method}
      />
      <LoanPaidCreateModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
}

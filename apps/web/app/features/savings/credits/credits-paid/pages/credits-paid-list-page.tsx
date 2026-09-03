'use client';

import { useState } from 'react';
import { CreditsPaidHeader } from '../components/credits-paid-header';
import { CreditsPaidList } from '../components/credits-paid-list';
import { CreditsPaidTableAction } from '../components/credits-paid-tables/credits-paid-table-action';
import { CreditPaidCreateModal } from '../components/credit-paid-create-modal';
import { CreditPaidBulkModal } from '../components/credit-paid-bulk-modal';
import { useCreditsPaidFilters } from '../hooks/use-credits-paid-filters';

export default function CreditsPaidListPage() {
  const { filters } = useCreditsPaidFilters();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  return (
    <div className="space-y-4">
      <CreditsPaidHeader />
      <CreditsPaidTableAction
        onCreateClick={() => setCreateModalOpen(true)}
        onBulkClick={() => setBulkModalOpen(true)}
      />
      <CreditsPaidList
        page={filters.page}
        search={filters.search}
        limit={filters.limit}
        bank={filters.bank}
        type={filters.type}
        method={filters.method}
      />
      <CreditPaidCreateModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
      <CreditPaidBulkModal
        open={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
      />
    </div>
  );
}

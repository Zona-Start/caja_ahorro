'use client';

import { useState } from 'react';
import { Separator } from '@repo/shadcn/separator';
import { LoansHeader } from '../components/ordinary-loans-header';
import { LoansTableAction } from '../components/loans-tables/ordinary-loans-table-action';
import { OrdinaryLoansList } from '../components/ordinary-loans-list';
import { CreateLoanModal } from '../components/loan-create-modal';
import { LoanBulkModal } from '../components/loan-bulk-modal';
import { useLoansFilters } from '../hooks/use-loans-filters';
import type { LoanTableRow } from '../components/loans-tables/columns';
import { LoanDetailsModal } from '@/features/savings/partners/inquiry/components/loans/loan-details-modal';

export default function LoansManagementListPage() {
  const { filters, setFilters } = useLoansFilters();
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [viewData, setViewData] = useState<LoanTableRow | null>(null);

  return (
    <div className="space-y-4">
      <LoansHeader />
      <Separator />
      <LoansTableAction
        filters={filters}
        setFilters={setFilters}
        onNewLoan={() => setModalOpen(true)}
        onBulkUpload={() => setBulkModalOpen(true)}
      />
      <OrdinaryLoansList
        page={filters.page}
        limit={filters.limit}
        search={filters.search}
        status={filters.status}
        type={filters.type}
        modality={filters.modality}
        onViewDetails={(data) => setViewData(data)}
      />
      <CreateLoanModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
      <LoanBulkModal
        open={bulkModalOpen}
        onOpenChange={setBulkModalOpen}
      />

      <LoanDetailsModal
        loanId={viewData?.id ?? null}
        open={!!viewData}
        onOpenChange={(open) => {
          if (!open) setViewData(null);
        }}
      />
    </div>
  );
}

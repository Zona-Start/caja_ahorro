import { useState } from 'react';
import { Separator } from '@repo/shadcn/separator';
import { queryClient } from '@/lib/query-client';
import { OrdinaryCreditsHeader } from '../components/ordinary-credits-header';
import { OrdinaryCreditsList } from '../components/ordinary-credits-list';
import { OrdinaryCreditsTableAction } from '../components/credits-tables/ordinary-credits-table-action';
import { CreateCreditModal } from '../components/credit-create-modal';
import { CreditBulkModal } from '../components/credit-bulk-modal';
import { useCreditsFilters } from '../hooks/use-credits-filters';
import { creditManagementLoader } from '../loaders/credits-management.loader';
import { creditManagementAction } from '../loaders/credits-management.action';
import type { CreditTableRow } from '../components/credits-tables/columns';
import { CreditDetailsModal } from '@/features/savings/partners/inquiry/components/credits/credit-details-modal';

export const clientLoader = creditManagementLoader(queryClient);

export const clientAction = creditManagementAction(queryClient);

export default function CreditsManagementListPage() {
  const { filters } = useCreditsFilters();
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [viewData, setViewData] = useState<CreditTableRow | null>(null);

  return (
    <div className="space-y-4">
      <OrdinaryCreditsHeader />
      <Separator />
      <OrdinaryCreditsTableAction
        onNewCredit={() => setModalOpen(true)}
        onBulkUpload={() => setBulkModalOpen(true)}
      />
      <OrdinaryCreditsList
        page={filters.page}
        search={filters.search}
        limit={filters.limit}
        status={filters.status}
        type={filters.type}
        modality={filters.modality}
        onViewDetails={(data) => setViewData(data)}
      />
      <CreateCreditModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
      <CreditBulkModal
        open={bulkModalOpen}
        onOpenChange={setBulkModalOpen}
      />

      <CreditDetailsModal
        creditId={viewData?.id ?? null}
        open={!!viewData}
        onOpenChange={(open) => {
          if (!open) setViewData(null);
        }}
      />
    </div>
  );
}

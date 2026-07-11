import { Separator } from '@repo/shadcn/separator';
import { PaymentBatchHeader } from '../components/payment-batch-header';
import { PaymentBatchList } from '../components/payment-batch-list';
import { PaymentBatchTableAction } from '../components/payment-batch-tables/payment-batch-table-action';
import { PaymentBatchModal } from '../components/payment-batch-modal';
import { ConfirmBatchModal } from '../components/confirm-batch-modal';
import { PaymentBatchDetailModal } from '../components/payment-batch-detail-modal';
import { usePaymentBatchFilters } from '../hooks/use-payment-batch-filters';
import { usePaymentBatchModalStore } from '../store/payment-batch-store';

export function PaymentBatchListPage() {
  const { filters } = usePaymentBatchFilters();
  const { isDetailOpen, closeDetailModal, detailBatchId } =
    usePaymentBatchModalStore();

  return (
    <div className="space-y-4">
      <PaymentBatchHeader />
      <Separator />
      <PaymentBatchTableAction />
      <PaymentBatchList
        page={filters.page}
        search={filters.search}
        limit={filters.limit}
        status={filters.status}
      />
      <PaymentBatchModal />
      <ConfirmBatchModal />
      <PaymentBatchDetailModal
        isOpen={isDetailOpen}
        onClose={closeDetailModal}
        batchId={detailBatchId}
      />
    </div>
  );
}

export default PaymentBatchListPage;

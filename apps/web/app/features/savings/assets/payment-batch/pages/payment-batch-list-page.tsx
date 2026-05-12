import { Separator } from '@repo/shadcn/separator';
import { PaymentBatchHeader } from '../components/payment-batch-header';
import { PaymentBatchList } from '../components/payment-batch-list';
import { PaymentBatchTableAction } from '../components/payment-batch-tables/payment-batch-table-action';
import { usePaymentBatchFilters } from '../hooks/use-payment-batch-filters';

export function PaymentBatchListPage() {
  const { filters } = usePaymentBatchFilters();

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
    </div>
  );
}

export default PaymentBatchListPage;

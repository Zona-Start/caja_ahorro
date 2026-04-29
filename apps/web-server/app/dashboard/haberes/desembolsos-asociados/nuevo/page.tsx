import PageContainer from '@/components/layout/page-container';
import { PaymentBatchView } from '@/feactures/savings-banks/assets/paymentBatch/components/payment-batch-view';

export const metadata = {
  title: 'Dashboard: Nuevo Desembolso',
};

export default async function Page() {
  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-6">
        <PaymentBatchView />
      </div>
    </PageContainer>
  );
}

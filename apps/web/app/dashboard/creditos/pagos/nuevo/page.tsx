import PageContainer from '@/components/layout/page-container';
import { CreditPaidView } from '@/feactures/savings-banks/credits/credits-paid/components/credit-paid-view';

export const metadata = {
  title: 'Dashboard: Nuevo Pago',
};

export default async function Page() {
  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-6">
        <CreditPaidView />
      </div>
    </PageContainer>
  );
}

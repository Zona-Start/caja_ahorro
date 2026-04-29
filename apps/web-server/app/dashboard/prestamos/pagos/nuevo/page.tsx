import PageContainer from '@/components/layout/page-container';
import { LoanPaidView } from '@/feactures/savings-banks/loans/loans-paid/components/loan-paid-view';

export const metadata = {
  title: 'Dashboard: Nuevo Pago',
};

export default async function Page() {
  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-6">
        <LoanPaidView />
      </div>
    </PageContainer>
  );
}

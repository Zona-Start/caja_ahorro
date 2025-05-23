import PageContainer from '@/components/layout/page-container';
import { LoanView } from '@/feactures/savings-banks/loans/loans-management/components/loan-view';

export const metadata = {
  title: 'Dashboard: Nuevo Prestamos',
};

export default async function Page() {
  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-6">
        <LoanView />
      </div>
    </PageContainer>
  );
}

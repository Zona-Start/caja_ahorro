import PageContainer from '@/components/layout/page-container';
import { CreditView } from '@/feactures/savings-banks/credits/credits-management/components/credit-view';

export const metadata = {
  title: 'Dashboard: Nuevo Crédito',
};

export default async function Page() {
  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-6">
        <CreditView />
      </div>
    </PageContainer>
  );
}

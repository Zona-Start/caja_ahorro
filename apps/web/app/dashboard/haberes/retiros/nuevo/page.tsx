import PageContainer from '@/components/layout/page-container';
import { WithdrawalView } from '@/feactures/savings-banks/assets/withdrawal/components/withdrawal-view';

export const metadata = {
  title: 'Dashboard: Nuevo Retiro',
};

export default async function Page() {
  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-6">
        <WithdrawalView />
      </div>
    </PageContainer>
  );
}

import PageContainer from '@/components/layout/page-container';
import { SettlementView } from '@/feactures/savings-banks/assets/settlement/components/settlement-view';

export const metadata = {
  title: 'Dashboard: Nueva Liquidación',
};

export default async function Page() {
  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-6">
        <SettlementView />
      </div>
    </PageContainer>
  );
}

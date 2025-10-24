import PageContainer from '@/components/layout/page-container';
import ReportsAssociatePage from '@/feactures/reports/components/reports-view-associate';

export const metadata = {
  title: 'Dashboard: Reportes Asociados',
};

export default async function Page() {
  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <ReportsAssociatePage />
      </div>
    </PageContainer>
  );
}

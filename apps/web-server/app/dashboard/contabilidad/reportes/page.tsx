import PageContainer from '@/components/layout/page-container';
import { AccountingReportsPage } from '@/feactures/accounting/accounting-reports/components/accounting-reports-page';

export const metadata = {
  title: 'Dashboard: Reportes Contables',
};

export default function Page() {
  return (
    <PageContainer scrollable>
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            Reportes Contables
          </h2>
        </div>
        <AccountingReportsPage />
      </div>
    </PageContainer>
  );
}

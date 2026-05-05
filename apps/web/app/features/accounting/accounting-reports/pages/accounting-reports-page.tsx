import PageContainer from '@/components/shared/page-container';
import { Heading } from '@repo/shadcn/heading';
import { AccountingReportsPage } from '../components/accounting-reports-page';

export default function ReportsPage() {
  return (
    <PageContainer scrollable={true}>
      <div className="flex flex-1 flex-col space-y-4">
        <Heading
          title="Reportes Contables"
          description="Visualiza los estados financieros y libros contables"
        />
        <AccountingReportsPage />
      </div>
    </PageContainer>
  );
}

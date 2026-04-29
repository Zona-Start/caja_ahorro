import PageContainer from '@/components/layout/page-container';
import { BankReconciliationForm } from '@/feactures/banks/bank-reconciliations/components/bank-reconciliation-form';

export const metadata = {
  title: 'Dashboard: Nueva Conciliación Bancaria',
};

export default async function Page() {
  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-6">
        <BankReconciliationForm />
      </div>
    </PageContainer>
  );
}

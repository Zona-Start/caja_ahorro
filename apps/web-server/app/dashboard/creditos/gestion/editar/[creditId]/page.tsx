'use client';
import PageContainer from '@/components/layout/page-container';
import { CreditView } from '@/feactures/savings-banks/credits/credits-management/components/credit-view';
import { useQueryCreditManagementById } from '@/feactures/savings-banks/credits/credits-management/hooks/use-query-credits-management';
import { useParams } from 'next/navigation';

export default function EditCreditPage() {
  const params = useParams();
  const creditId = params.creditId ? Number(params.creditId) : null;

  const { data: creditData } = useQueryCreditManagementById(creditId, {
    enabled: creditId !== null, // Only fetch if loanId is available
  });

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-6">
        <CreditView isEdit={true} initialData={creditData} />
      </div>
    </PageContainer>
  );
}

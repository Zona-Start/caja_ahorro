'use client';

import PageContainer from '@/components/layout/page-container';
import { LoanView } from '@/feactures/savings-banks/loans/loans-management/components/loan-view';
import { useQueryLoanManagementById } from '@/feactures/savings-banks/loans/loans-management/hooks/use-query-loans-management';
import { useParams } from 'next/navigation';

export default function EditLoanPage() {
  const params = useParams();
  const loanId = params.loanId ? Number(params.loanId) : null;

  const { data: loanData } = useQueryLoanManagementById(loanId, {
    enabled: loanId !== null, // Only fetch if loanId is available
  });

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-6">
        <LoanView isEdit={true} initialData={loanData} />
      </div>
    </PageContainer>
  );
}

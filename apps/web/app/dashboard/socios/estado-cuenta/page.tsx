import PageContainer from '@/components/layout/page-container';
import InquiryPage from '@/feactures/savings-banks/partners/inquiry/page';

export const metadata = {
  title: 'Dashboard: Estado de Cuenta Asociado',
};

export default async function Page() {
  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <InquiryPage />
      </div>
    </PageContainer>
  );
}

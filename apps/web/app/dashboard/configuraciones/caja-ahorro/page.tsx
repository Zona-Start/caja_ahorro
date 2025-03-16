import PageContainer from '@/components/layout/page-container';
import { SavingBankView } from '@/feactures/savings-banks/saving-bank/components/saving-bank-view';

const Page = () => {
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <SavingBankView />
      </div>
    </PageContainer>
  );
};

export default Page;

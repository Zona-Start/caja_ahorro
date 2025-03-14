import PageContainer from '@/components/layout/page-container';
import { SavingBankView } from '@/feactures/savings-banks/saving-bank/components/saving-bank-view';

const Page = () => {
  return (
    <PageContainer>
       <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <SavingBankView />
       </div>
      
    </PageContainer>
    // <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
    //   <div className="flex w-full max-w-sm flex-col gap-6">
       
    //   </div>
    // </div>
  );
};

export default Page;

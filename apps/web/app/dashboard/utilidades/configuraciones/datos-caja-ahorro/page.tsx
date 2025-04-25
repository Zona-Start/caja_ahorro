import PageContainer from '@/components/layout/page-container';
import { CompanyView } from '@/feactures/configurations/company/components/company-view';

const Page = () => {
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <CompanyView />
      </div>
    </PageContainer>
  );
};

export default Page;

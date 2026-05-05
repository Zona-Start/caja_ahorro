import { useSearchParams } from 'react-router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/shadcn/tabs';
import { type AssociateDetails } from '../schemas/inquiry-schema';
import { CreditsTab } from './credits/credits-tab';
import { HaberesTab } from './haberes/haberes-tab';
import { HistoryTab } from './history/history-tab';
import { LoansTab } from './loans/loans-tab';
import { WithdrawalsTab } from './withdrawals/withdrawals-tab';

interface InquiryTabsProps {
  associate: AssociateDetails;
}

export function InquiryTabs({ associate }: InquiryTabsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const activeTab = searchParams.get('tab') || 'haberes';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  const handleTabChange = (newTab: string) => {
    setSearchParams((prev) => {
      prev.set('tab', newTab);
      prev.set('page', '1');
      prev.set('limit', '10');
      return prev;
    });
  };

  const setPage = (newPage: number) => {
    setSearchParams((prev) => {
      prev.set('page', newPage.toString());
      return prev;
    });
  };

  return (
    <div className="w-full flex flex-col">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex flex-1 flex-col w-full"
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger
            value="haberes"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary"
          >
            Haberes
          </TabsTrigger>
          <TabsTrigger
            value="retiros"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary"
          >
            Retiros
          </TabsTrigger>
          <TabsTrigger
            value="historial"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary"
          >
            Historial
          </TabsTrigger>
          <TabsTrigger
            value="prestamos"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary"
          >
            Préstamos
          </TabsTrigger>
          <TabsTrigger
            value="creditos"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary"
          >
            Créditos
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="haberes" className="mt-4">
          <HaberesTab
            id={associate.id}
            page={page}
            setPage={setPage}
            limit={limit}
          />
        </TabsContent>
        <TabsContent value="retiros" className="mt-4">
          <WithdrawalsTab
            id={associate.id}
            page={page}
            setPage={setPage}
            limit={limit}
          />
        </TabsContent>
        <TabsContent value="historial" className="mt-4">
          <HistoryTab
            id={associate.id}
            page={page}
            setPage={setPage}
            limit={limit}
          />
        </TabsContent>
        <TabsContent value="prestamos" className="mt-4">
          <LoansTab
            id={associate.id}
            page={page}
            setPage={setPage}
            limit={limit}
          />
        </TabsContent>
        <TabsContent value="creditos" className="mt-4">
          <CreditsTab
            id={associate.id}
            page={page}
            setPage={setPage}
            limit={limit}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

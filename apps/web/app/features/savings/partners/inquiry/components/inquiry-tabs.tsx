import { useSearchParams } from 'react-router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/shadcn/tabs';
import {
  PiggyBank,
  ArrowDownToLine,
  History,
  Landmark,
  ShoppingCart,
} from 'lucide-react';
import type { AssociateStatement } from '../schemas/inquiry-schema';
import { CreditsTab } from './credits/credits-tab';
import { HaberesTab } from './haberes/haberes-tab';
import { HistoryTab } from './history/history-tab';
import { LoansTab } from './loans/loans-tab';
import { WithdrawalsTab } from './withdrawals/withdrawals-tab';

interface InquiryTabsProps {
  associate: AssociateStatement;
}

const tabs = [
  { value: 'haberes', label: 'Haberes', icon: PiggyBank },
  { value: 'retiros', label: 'Retiros', icon: ArrowDownToLine },
  { value: 'historial', label: 'Historial', icon: History },
  { value: 'prestamos', label: 'Préstamos', icon: Landmark },
  { value: 'creditos', label: 'Créditos', icon: ShoppingCart },
] as const;

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
    <div className="w-full">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex flex-col w-full"
      >
        <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-muted/50">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-1.5 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
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

import { useState, useCallback } from 'react';
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

type TabValue = (typeof tabs)[number]['value'];

interface TabPageState {
  page: number;
  limit: number;
}

const DEFAULT_PAGE_STATE: TabPageState = { page: 1, limit: 10 };

export function InquiryTabs({ associate }: InquiryTabsProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('haberes');

  const [pageStates, setPageStates] = useState<
    Record<TabValue, TabPageState>
  >({
    haberes: { ...DEFAULT_PAGE_STATE },
    retiros: { ...DEFAULT_PAGE_STATE },
    historial: { ...DEFAULT_PAGE_STATE },
    prestamos: { ...DEFAULT_PAGE_STATE },
    creditos: { ...DEFAULT_PAGE_STATE },
  });

  const handleTabChange = useCallback((newTab: string) => {
    setActiveTab(newTab as TabValue);
    setPageStates((prev) => ({
      ...prev,
      [newTab as TabValue]: { ...DEFAULT_PAGE_STATE },
    }));
  }, []);

  const createSetPage = useCallback(
    (tab: TabValue) => (newPage: number) => {
      setPageStates((prev) => ({
        ...prev,
        [tab]: { ...prev[tab], page: newPage },
      }));
    },
    [],
  );

  const state = pageStates[activeTab];

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

        <div className="mt-4">
          <TabsContent value="haberes" forceMount hidden={activeTab !== 'haberes'}>
            <HaberesTab
              id={associate.id}
              page={pageStates.haberes.page}
              setPage={createSetPage('haberes')}
              limit={pageStates.haberes.limit}
            />
          </TabsContent>
          <TabsContent value="retiros" forceMount hidden={activeTab !== 'retiros'}>
            <WithdrawalsTab
              id={associate.id}
              page={pageStates.retiros.page}
              setPage={createSetPage('retiros')}
              limit={pageStates.retiros.limit}
            />
          </TabsContent>
          <TabsContent value="historial" forceMount hidden={activeTab !== 'historial'}>
            <HistoryTab
              id={associate.id}
              page={pageStates.historial.page}
              setPage={createSetPage('historial')}
              limit={pageStates.historial.limit}
            />
          </TabsContent>
          <TabsContent value="prestamos" forceMount hidden={activeTab !== 'prestamos'}>
            <LoansTab
              id={associate.id}
              page={pageStates.prestamos.page}
              setPage={createSetPage('prestamos')}
              limit={pageStates.prestamos.limit}
            />
          </TabsContent>
          <TabsContent value="creditos" forceMount hidden={activeTab !== 'creditos'}>
            <CreditsTab
              id={associate.id}
              page={pageStates.creditos.page}
              setPage={createSetPage('creditos')}
              limit={pageStates.creditos.limit}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

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

const INITIAL_PAGE_STATES: Record<TabValue, TabPageState> = {
  haberes: { ...DEFAULT_PAGE_STATE },
  retiros: { ...DEFAULT_PAGE_STATE },
  historial: { ...DEFAULT_PAGE_STATE },
  prestamos: { ...DEFAULT_PAGE_STATE },
  creditos: { ...DEFAULT_PAGE_STATE },
};

export function InquiryTabs({ associate }: InquiryTabsProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('haberes');
  const [pageStates, setPageStates] =
    useState<Record<TabValue, TabPageState>>(INITIAL_PAGE_STATES);

  const setTabPage = useCallback((tab: TabValue, page: number) => {
    setPageStates((prev) => ({
      ...prev,
      [tab]: { ...prev[tab], page },
    }));
  }, []);

  const setTabLimit = useCallback((tab: TabValue, limit: number) => {
    setPageStates((prev) => ({
      ...prev,
      [tab]: { page: 1, limit },
    }));
  }, []);

  return (
    <div className="w-full">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabValue)}
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
          <TabsContent
            value="haberes"
            forceMount
            hidden={activeTab !== 'haberes'}
          >
            <HaberesTab
              id={associate.id}
              page={pageStates.haberes.page}
              setPage={(p) => setTabPage('haberes', p)}
              limit={pageStates.haberes.limit}
              setLimit={(l) => setTabLimit('haberes', l)}
            />
          </TabsContent>
          <TabsContent
            value="retiros"
            forceMount
            hidden={activeTab !== 'retiros'}
          >
            <WithdrawalsTab
              id={associate.id}
              page={pageStates.retiros.page}
              setPage={(p) => setTabPage('retiros', p)}
              limit={pageStates.retiros.limit}
              setLimit={(l) => setTabLimit('retiros', l)}
            />
          </TabsContent>
          <TabsContent
            value="historial"
            forceMount
            hidden={activeTab !== 'historial'}
          >
            <HistoryTab
              id={associate.id}
              page={pageStates.historial.page}
              setPage={(p) => setTabPage('historial', p)}
              limit={pageStates.historial.limit}
              setLimit={(l) => setTabLimit('historial', l)}
            />
          </TabsContent>
          <TabsContent
            value="prestamos"
            forceMount
            hidden={activeTab !== 'prestamos'}
          >
            <LoansTab
              id={associate.id}
              page={pageStates.prestamos.page}
              setPage={(p) => setTabPage('prestamos', p)}
              limit={pageStates.prestamos.limit}
              setLimit={(l) => setTabLimit('prestamos', l)}
            />
          </TabsContent>
          <TabsContent
            value="creditos"
            forceMount
            hidden={activeTab !== 'creditos'}
          >
            <CreditsTab
              id={associate.id}
              page={pageStates.creditos.page}
              setPage={(p) => setTabPage('creditos', p)}
              limit={pageStates.creditos.limit}
              setLimit={(l) => setTabLimit('creditos', l)}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

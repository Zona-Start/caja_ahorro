'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/shadcn/tabs';
import { useQueryState } from 'nuqs';
import { parseAsInteger, parseAsString } from 'nuqs/server';
import { AssociateDetails } from '../schemas/inquiry-schema';
import { CreditsTab } from './credits/credits-tab';
import { HaberesTab } from './haberes/haberes-tab';
import { HistoryTab } from './history/history-tab';
import { LoansTab } from './loans/loans-tab';
import { WithdrawalsTab } from './withdrawals/withdrawals-tab';

interface InquiryTabsProps {
  associate: AssociateDetails;
}

export function InquiryTabs({ associate }: InquiryTabsProps) {
  const [activeTab, setActiveTab] = useQueryState(
    'tab',
    parseAsString.withDefault('haberes'),
  );

  const [haberesPage, setHaberesPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(1),
  );
  const [retirosPage, setRetirosPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(1),
  );
  const [historialPage, setHistorialPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(1),
  );

  const [prestamosPage, setPrestamosPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(1),
  );
  const [creditosPage, setCreditosPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(1),
  );

  const [limit, setLimit] = useQueryState(
    'limit',
    parseAsInteger.withDefault(10),
  );

  const handleTabChange = (newTab: string) => {
    switch (newTab) {
      case 'haberes':
        setHaberesPage(1);
        setLimit(10);
        break;
      case 'retiros':
        setRetirosPage(1);
        setLimit(10);
        break;
      case 'historial':
        setHistorialPage(1);
        setLimit(10);
        break;
      case 'prestamos':
        setPrestamosPage(1);
        setLimit(10);
        break;
      case 'creditos':
        setCreditosPage(1);
        setLimit(10);
        break;
    }
    setActiveTab(newTab);
  };

  return (
    <div className="w-full  h-[80vh] flex flex-col">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex flex-1 flex-col w-full"
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger
            value="haberes"
            className={`border-b-2 ${
              activeTab === 'haberes'
                ? 'border-b-primary dark:!border-b-primary'
                : 'border-transparent dark:border-transparent'
            }`}
          >
            Haberes
          </TabsTrigger>
          <TabsTrigger
            value="retiros"
            className={`border-b-2 ${
              activeTab === 'retiros'
                ? 'border-b-primary dark:!border-b-primary'
                : 'border-transparent'
            }`}
          >
            Retiros
          </TabsTrigger>
          <TabsTrigger
            value="historial"
            className={`border-b-2 ${
              activeTab === 'historial'
                ? 'border-b-primary dark:!border-b-primary'
                : 'border-transparent'
            }`}
          >
            Historial
          </TabsTrigger>
          <TabsTrigger
            value="prestamos"
            className={`border-b-2 ${
              activeTab === 'prestamos'
                ? 'border-b-primary dark:!border-b-primary'
                : 'border-transparent'
            }`}
          >
            Préstamos
          </TabsTrigger>
          <TabsTrigger
            value="creditos"
            className={`border-b-2 ${
              activeTab === 'creditos'
                ? 'border-b-primary dark:!border-b-primary'
                : 'border-transparent dark:border-transparent'
            }`}
          >
            Créditos
          </TabsTrigger>
        </TabsList>
        <TabsContent value="haberes" className="flex-1 flex flex-col mt-4">
          <HaberesTab
            id={associate.id}
            page={haberesPage}
            setPage={setHaberesPage}
            limit={limit}
          />
        </TabsContent>
        <TabsContent value="retiros" className="flex-1 flex flex-col mt-4">
          <WithdrawalsTab
            id={associate.id}
            page={retirosPage}
            setPage={setRetirosPage}
            limit={limit}
          />
        </TabsContent>
        <TabsContent value="historial" className="flex-1 flex flex-col mt-4">
          <HistoryTab
            id={associate.id}
            page={historialPage}
            setPage={setHistorialPage}
            limit={limit}
          />
        </TabsContent>
        <TabsContent value="prestamos" className="flex-1 flex flex-col mt-4">
          <LoansTab
            id={associate.id}
            page={prestamosPage}
            setPage={setPrestamosPage}
            limit={limit}
          />
        </TabsContent>
        <TabsContent value="creditos" className="flex-1 flex flex-col mt-4">
          <CreditsTab
            id={associate.id}
            page={creditosPage}
            setPage={setCreditosPage}
            limit={limit}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

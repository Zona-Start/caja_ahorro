'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/shadcn/tabs';
import { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState('haberes');

  return (
    <div className="w-full  h-[80vh] flex flex-col">
      <Tabs
        defaultValue="haberes"
        onValueChange={setActiveTab}
        className="flex flex-col flex-1 w-full"
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger
            value="haberes"
            onClick={() => setActiveTab('haberes')}
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
            onClick={() => setActiveTab('retiros')}
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
            onClick={() => setActiveTab('historial')}
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
            onClick={() => setActiveTab('prestamos')}
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
            onClick={() => setActiveTab('creditos')}
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
          <HaberesTab id={associate.id} />
        </TabsContent>
        <TabsContent value="retiros" className="flex-1 flex flex-col mt-4">
          <WithdrawalsTab id={associate.id} />
        </TabsContent>
        <TabsContent value="historial" className="flex-1 flex flex-col mt-4">
          <HistoryTab id={associate.id} />
        </TabsContent>
        <TabsContent value="prestamos" className="flex-1 flex flex-col mt-4">
          <LoansTab id={associate.id} />
        </TabsContent>
        <TabsContent value="creditos" className="flex-1 flex flex-col mt-4">
          <CreditsTab id={associate.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/shadcn/tabs';
import { useState } from 'react';
import {
  useCredits,
  useHaberesMovements,
  useLoans,
  useTransactionHistory,
  useWithdrawals,
} from '../hooks/use-inquiry-queries';
import { AssociateDetails } from '../schemas/inquiry-schema';
import { CreditsTab } from './tabs/credits-tab';
import { HaberesTab } from './tabs/haberes-tab';
import { TransactionHistoryTab } from './tabs/history-tab';
import { LoansTab } from './tabs/loans-tab';
import { WithdrawalsTab } from './tabs/withdrawals-tab';

interface InquiryTabsProps {
  associate: AssociateDetails;
}

export function InquiryTabs({ associate }: InquiryTabsProps) {
  const [activeTab, setActiveTab] = useState('haberes');

  const {
    data: haberesData,
    isLoading: haberesLoading,
    isError: haberesIsError,
  } = useHaberesMovements(associate.id, { enabled: activeTab === 'haberes' });
  const {
    data: withdrawalsData,
    isLoading: withdrawalsLoading,
    isError: withdrawalsIsError,
  } = useWithdrawals(associate.id, { enabled: activeTab === 'retiros' });
  const {
    data: historyData,
    isLoading: historyLoading,
    isError: historyIsError,
  } = useTransactionHistory(associate.id, {
    enabled: activeTab === 'historial',
  });
  const {
    data: loansData,
    isLoading: loansLoading,
    isError: loansIsError,
  } = useLoans(associate.id, { enabled: activeTab === 'prestamos' });
  const {
    data: creditsData,
    isLoading: creditsLoading,
    isError: creditsIsError,
  } = useCredits(associate.id, { enabled: activeTab === 'creditos' });

  return (
    <Tabs
      defaultValue="haberes"
      onValueChange={setActiveTab}
      className="max-w-full"
    >
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger
          value="haberes"
          onClick={() => setActiveTab('haberes')}
          className={`border-b-2 ${
            activeTab === 'haberes' ? 'border-b-primary' : 'border-transparent'
          }`}
        >
          Haberes
        </TabsTrigger>
        <TabsTrigger
          value="retiros"
          onClick={() => setActiveTab('retiros')}
          className={`border-b-2 ${
            activeTab === 'retiros' ? 'border-b-primary' : 'border-transparent'
          }`}
        >
          Retiros
        </TabsTrigger>
        <TabsTrigger
          value="historial"
          onClick={() => setActiveTab('historial')}
          className={`border-b-2 ${
            activeTab === 'historial'
              ? 'border-b-primary'
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
              ? 'border-b-primary'
              : 'border-transparent'
          }`}
        >
          Préstamos
        </TabsTrigger>
        <TabsTrigger
          value="creditos"
          onClick={() => setActiveTab('creditos')}
          className={`border-b-2 ${
            activeTab === 'creditos' ? 'border-b-primary' : 'border-transparent'
          }`}
        >
          Créditos
        </TabsTrigger>
      </TabsList>
      <TabsContent value="haberes">
        <HaberesTab
          data={haberesData!}
          isLoading={haberesLoading}
          isError={haberesIsError}
        />
      </TabsContent>
      <TabsContent value="retiros">
        <WithdrawalsTab
          data={withdrawalsData!}
          isLoading={withdrawalsLoading}
          isError={withdrawalsIsError}
        />
      </TabsContent>
      <TabsContent value="historial">
        <TransactionHistoryTab
          data={historyData!}
          isLoading={historyLoading}
          isError={historyIsError}
        />
      </TabsContent>
      <TabsContent value="prestamos">
        <LoansTab
          data={loansData!}
          isLoading={loansLoading}
          isError={loansIsError}
        />
      </TabsContent>
      <TabsContent value="creditos">
        <CreditsTab
          data={creditsData!}
          isLoading={creditsLoading}
          isError={creditsIsError}
        />
      </TabsContent>
    </Tabs>
  );
}

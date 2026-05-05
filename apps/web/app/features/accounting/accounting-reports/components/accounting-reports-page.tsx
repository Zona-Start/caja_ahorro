import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/shadcn/tabs';
import { useSearchParams } from 'react-router';
import { useCallback, useEffect, useState } from 'react';
import { BalanceSheetReport } from './balance-sheet-report';
import { GeneralLedgerReport } from './general-ledger-report';
import { IncomeStatementReport } from './income-statement-report';
import { JournalBookReport } from './journal-book-report';
import { TrialBalanceReport } from './trial-balance-report';

export function AccountingReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'journal-book';
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams);
    params.set('tab', value);
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams, activeTab]);

  return (
    <div className="container mx-auto py-6">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-6 mb-6">
          <TabsTrigger value="journal-book">Libro Diario</TabsTrigger>
          <TabsTrigger value="general-ledger">Libro Mayor</TabsTrigger>
          <TabsTrigger value="trial-balance">
            Balance de Comprobación
          </TabsTrigger>
          <TabsTrigger value="balance-sheet">Balance General</TabsTrigger>
          <TabsTrigger value="income-statement">
            Estado de Resultados
          </TabsTrigger>
          <TabsTrigger value="associates-balance">
            Balance de Asociados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="journal-book">
          <JournalBookReport />
        </TabsContent>

        <TabsContent value="general-ledger">
          <GeneralLedgerReport />
        </TabsContent>

        <TabsContent value="trial-balance">
          <TrialBalanceReport />
        </TabsContent>

        <TabsContent value="balance-sheet">
          <BalanceSheetReport />
        </TabsContent>

        <TabsContent value="income-statement">
          <IncomeStatementReport />
        </TabsContent>

        <TabsContent value="associates-balance">
          <div className="text-center py-12 text-muted-foreground">
            Próximamente: Balance de Asociados
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

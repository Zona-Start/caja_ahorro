import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/shadcn/tabs';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { AccountBalanceReport } from './account-balance-report';
import { AssociatesBalanceReport } from './associates-balance-report';
import { BalanceSheetReport } from './balance-sheet-report';
import { GeneralLedgerReport } from './general-ledger-report';
import { IncomeStatementReport } from './income-statement-report';
import { JournalBookReport } from './journal-book-report';
import { TrialBalanceReport } from './trial-balance-report';

const tabTriggerClassName =
  "relative h-auto min-h-9 w-full whitespace-normal break-words px-2 py-2 text-center text-xs leading-tight sm:text-sm data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent data-[state=active]:text-primary dark:data-[state=active]:text-primary data-[state=active]:shadow-none dark:data-[state=active]:shadow-none data-[state=active]:border-transparent dark:data-[state=active]:border-transparent data-[state=active]:font-semibold focus-visible:ring-0 focus-visible:outline-none focus-visible:border-transparent after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:rounded-full after:bg-primary after:opacity-0 after:content-[''] data-[state=active]:after:opacity-100";

export function AccountingReportsPage() {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || 'journal-book';
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  // Sincroniza cuando se llega desde el menú lateral u otra navegación real.
  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);

    // Actualizamos la URL sin navegar ni volver a ejecutar loaders del router.
    const url = new URL(window.location.href);
    url.searchParams.set('tab', value);
    window.history.replaceState({}, '', url.toString());
    window.dispatchEvent(new Event('accounting-report-tab-change'));
  };

  return (
    <div className="container mx-auto py-6">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="mb-6 grid h-auto w-full grid-cols-2 gap-1 p-1 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7">
          <TabsTrigger value="journal-book" className={tabTriggerClassName}>
            Libro Diario
          </TabsTrigger>
          <TabsTrigger value="general-ledger" className={tabTriggerClassName}>
            Libro Mayor
          </TabsTrigger>
          <TabsTrigger value="trial-balance" className={tabTriggerClassName}>
            Balance de Comprobación
          </TabsTrigger>
          <TabsTrigger value="balance-sheet" className={tabTriggerClassName}>
            Balance General
          </TabsTrigger>
          <TabsTrigger value="income-statement" className={tabTriggerClassName}>
            Estado de Resultados
          </TabsTrigger>
          <TabsTrigger
            value="associates-balance"
            className={tabTriggerClassName}
          >
            Balance de Asociados
          </TabsTrigger>
          <TabsTrigger value="account-balances" className={tabTriggerClassName}>
            Balance por Cuenta
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
          <AssociatesBalanceReport />
        </TabsContent>

        <TabsContent value="account-balances">
          <AccountBalanceReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/shadcn/tabs';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { SudecaReport } from './sudeca-report';

const tabTriggerClassName =
  "relative h-auto min-h-9 w-full whitespace-normal break-words px-2 py-2 text-center text-xs leading-tight sm:text-sm data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent data-[state=active]:text-primary dark:data-[state=active]:text-primary data-[state=active]:shadow-none dark:data-[state=active]:shadow-none data-[state=active]:border-transparent dark:data-[state=active]:border-transparent data-[state=active]:font-semibold focus-visible:ring-0 focus-visible:outline-none focus-visible:border-transparent after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:rounded-full after:bg-primary after:opacity-0 after:content-[''] data-[state=active]:after:opacity-100";

export function SudecaReportsPage() {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || 'financial-situation';
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);

    const url = new URL(window.location.href);
    url.searchParams.set('tab', value);
    window.history.replaceState({}, '', url.toString());
    window.dispatchEvent(new Event('accounting-report-tab-change'));
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="mb-6 grid h-auto w-full grid-cols-1 gap-1 p-1 sm:grid-cols-3">
        <TabsTrigger
          value="financial-situation"
          className={tabTriggerClassName}
        >
          Situación Financiera
        </TabsTrigger>
        <TabsTrigger value="income-statement" className={tabTriggerClassName}>
          Estado de Resultado
        </TabsTrigger>
        <TabsTrigger value="trial-balance" className={tabTriggerClassName}>
          Balance de Comprobación
        </TabsTrigger>
      </TabsList>

      <TabsContent value="financial-situation">
        <SudecaReport type="financial-situation" />
      </TabsContent>

      <TabsContent value="income-statement">
        <SudecaReport type="income-statement" />
      </TabsContent>

      <TabsContent value="trial-balance">
        <SudecaReport type="trial-balance" />
      </TabsContent>
    </Tabs>
  );
}

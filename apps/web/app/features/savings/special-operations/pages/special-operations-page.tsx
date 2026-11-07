'use client';

import { Separator } from '@repo/shadcn/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/shadcn/tabs';
import { Sparkles } from 'lucide-react';
import { SpecialOperationsHistoryTable } from '../components/history-table';
import { SpecialOperationWizard } from '../components/special-operation-wizard';

export default function SpecialOperationsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Operaciones Especiales
          </h1>
          <p className="text-sm text-muted-foreground">
            Procesa liquidaciones contra ingresos o retiros para cancelar
            préstamos con los haberes de los asociados.
          </p>
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="nueva" className="space-y-4">
        <TabsList>
          <TabsTrigger value="nueva">Nueva operación</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="nueva" className="space-y-4">
          <SpecialOperationWizard />
        </TabsContent>

        <TabsContent value="historial" className="space-y-4">
          <SpecialOperationsHistoryTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}

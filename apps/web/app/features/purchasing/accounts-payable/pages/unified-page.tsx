import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/shadcn/tabs';
import { UnifiedKpiCards } from '../components/unified-kpi-cards';
import { UnifiedCxpList } from '../components/unified-cxp-list';
import { PaymentHistoryList } from '@/features/purchasing/supplier-payments/components/payment-history-list';
import { AdvancesTabSimple } from '../components/advances-tab-simple';

export default function UnifiedAccountsPayablePage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Cuentas por Pagar</h2>
        <p className="text-sm text-muted-foreground">
          Gestiona las cuentas por pagar, pagos a proveedores y anticipos
        </p>
      </div>

      <UnifiedKpiCards />

      <Tabs defaultValue="cxp" className="w-full">
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="cxp">Cuentas por Pagar</TabsTrigger>
          <TabsTrigger value="history">Historial de Pagos</TabsTrigger>
          <TabsTrigger value="advances">Anticipos</TabsTrigger>
        </TabsList>
        <TabsContent value="cxp">
          <UnifiedCxpList />
        </TabsContent>
        <TabsContent value="history">
          <PaymentHistoryList />
        </TabsContent>
        <TabsContent value="advances">
          <AdvancesTabSimple />
        </TabsContent>
      </Tabs>
    </div>
  );
}

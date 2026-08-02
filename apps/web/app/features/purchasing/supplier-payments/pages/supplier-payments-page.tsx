import { useSearchParams } from 'react-router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/shadcn/tabs';
import { PendingPaymentsList } from '../components/pending-payments-list';
import { PaymentHistoryList } from '../components/payment-history-list';
import { AdvancesTab } from '../components/advances-tab';

export default function SupplierPaymentsPage() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'pending';

  return (
    <Tabs defaultValue={tab} className="w-full">
      <TabsList className="mb-4 flex-wrap h-auto">
        <TabsTrigger value="pending">Por Pagar</TabsTrigger>
        <TabsTrigger value="history">Historial de Pagos</TabsTrigger>
        <TabsTrigger value="advances">Anticipos / Saldos a Favor</TabsTrigger>
      </TabsList>
      <TabsContent value="pending">
        <PendingPaymentsList />
      </TabsContent>
      <TabsContent value="history">
        <PaymentHistoryList />
      </TabsContent>
      <TabsContent value="advances">
        <AdvancesTab />
      </TabsContent>
    </Tabs>
  );
}

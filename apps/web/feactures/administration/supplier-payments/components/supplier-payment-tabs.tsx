'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/shadcn/tabs';
import SupplierPaymentList from './supplier-payment-list';

interface TabsProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
  initialStatus?: string | null;
  initialSupplierId?: number | null;
  initialStartDate?: Date | null;
  initialEndDate?: Date | null;
}

export function SupplierPaymentTabs({
  initialPage,
  initialSearch,
  initialLimit,
  initialStatus,
  initialSupplierId,
  initialStartDate,
  initialEndDate,
}: TabsProps) {
  return (
    <Tabs defaultValue="pending">
      <TabsList>
        <TabsTrigger value="pending">Pagos Pendientes</TabsTrigger>
        <TabsTrigger value="history">Historial de Pagos</TabsTrigger>
      </TabsList>
      <TabsContent value="pending">
        <SupplierPaymentList
          initialPage={initialPage}
          initialSearch={initialSearch}
          initialLimit={initialLimit}
          initialStatus="PENDING,OVERDUE"
          initialSupplierId={initialSupplierId}
          initialStartDate={initialStartDate}
          initialEndDate={initialEndDate}
        />
      </TabsContent>
      <TabsContent value="history">
        <SupplierPaymentList
          initialPage={initialPage}
          initialSearch={initialSearch}
          initialLimit={initialLimit}
          initialStatus="PAID,CANCELLED"
          initialSupplierId={initialSupplierId}
          initialStartDate={initialStartDate}
          initialEndDate={initialEndDate}
        />
      </TabsContent>
    </Tabs>
  );
}

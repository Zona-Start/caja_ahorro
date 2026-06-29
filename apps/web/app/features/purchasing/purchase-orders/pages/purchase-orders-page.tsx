import { Separator } from '@repo/shadcn/separator';
import { PurchaseOrdersHeader } from '../components/purchase-orders-header';
import { PurchaseOrdersList } from '../components/purchase-orders-list';
import { PurchaseOrdersModal } from '../components/purchase-orders-modal';

export default function PurchaseOrdersPage() {
  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Órdenes de Compra</h2>
        <p className="text-muted-foreground">Gestione las órdenes de compra a proveedores.</p>
      </div>
      <Separator />
      <PurchaseOrdersHeader />
      <PurchaseOrdersList />
      <PurchaseOrdersModal />
    </div>
  );
}

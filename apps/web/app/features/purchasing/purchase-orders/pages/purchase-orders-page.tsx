import { Separator } from '@repo/shadcn/separator';
import { PurchaseOrdersHeader } from '../components/purchase-orders-header';
import { PurchaseOrdersList } from '../components/purchase-orders-list';
import { PurchaseOrdersModal } from '../components/purchase-orders-modal';
import { PurchaseOrdersTableAction } from '../components/purchase-orders-tables/purchase-orders-table-action';

export default function PurchaseOrdersPage() {
  return (
    <div className="flex flex-1 flex-col space-y-4">
      <PurchaseOrdersHeader />
      <Separator />
      <PurchaseOrdersTableAction />
      <PurchaseOrdersList />
      <PurchaseOrdersModal />
    </div>
  );
}

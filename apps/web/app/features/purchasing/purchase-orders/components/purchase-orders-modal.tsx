import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@repo/shadcn/dialog';
import { purchaseOrdersKeys } from '../keys';
import { PurchaseOrdersApi } from '../services/purchase-orders-api';
import { usePurchaseOrdersModalStore } from '../store/purchase-orders-modal.store';
import { usePurchaseOrderDefaults } from '../hooks/use-purchase-orders-queries';
import { PurchaseOrdersForm } from './purchase-orders-form';
import { PurchaseOrdersViewModal } from './purchase-orders-view-modal';
import type { PurchaseOrderApi } from '../schemas/purchase-orders-api.schema';
import type { PurchaseOrder } from '../schemas/purchase-orders.schema';

function apiToForm(order: PurchaseOrderApi, defaultTax: number): Partial<PurchaseOrder> {
  return {
    id: order.id,
    supplierId: order.supplierId,
    orderDate: typeof order.orderDate === 'string' ? order.orderDate.slice(0, 10) : String(order.orderDate).slice(0, 10),
    expectedDeliveryDate: order.expectedDeliveryDate
      ? (typeof order.expectedDeliveryDate === 'string' ? order.expectedDeliveryDate.slice(0, 10) : String(order.expectedDeliveryDate).slice(0, 10))
      : '',
    currencyCode: (order.currencyCode as 'VES' | 'USD' | 'EUR') || 'VES',
    purchaseExchangeRate: 1,
    subtotal: Number(order.subtotal) || 0,
    taxAmount: Number(order.taxAmount) || 0,
    totalAmount: Number(order.totalAmount) || 0,
    observations: order.observations ?? '',
    items: (order.items || []).map((item) => ({
      id: item.id,
      lineType: item.lineType as 'SALES_INVENTORY' | 'FIXED_ASSET' | 'SERVICE' | 'EXPENSE' | 'SERVICE_EXPENSE',
      productId: item.productId ?? '',
      itemId: item.itemId ?? '',
      description: item.description ?? '',
      quantity: Number(item.quantity) || 1,
      unitCost: Number(item.unitCost) || 0,
      totalCost: Number(item.totalCost) || 0,
      taxPercent: defaultTax,
    })),
  };
}

export function PurchaseOrdersModal() {
  const { isOpen, mode, data, closeModal } = usePurchaseOrdersModalStore();
  const { data: defaults } = usePurchaseOrderDefaults();
  const defaultTax = defaults?.taxPurchases ?? 16;

  const { data: fullOrder, isLoading } = useQuery({
    queryKey: purchaseOrdersKeys.detail(data?.id!),
    queryFn: () => PurchaseOrdersApi.getById(data?.id!),
    enabled: (mode === 'edit' || mode === 'view') && !!data?.id && isOpen,
  });

  if (mode === 'view') {
    return (
      <PurchaseOrdersViewModal
        open={isOpen}
        onOpenChange={(o) => { if (!o) closeModal(); }}
        orderId={data?.id}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o) closeModal(); }}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data?.id ? 'Editar Orden' : 'Nueva Orden de Compra'}</DialogTitle>
          <DialogDescription>
            {data?.id ? 'Modifique los datos de la orden de compra.' : 'Complete los datos para crear una nueva orden de compra.'}
          </DialogDescription>
        </DialogHeader>
        {mode === 'edit' && isLoading ? (
          <div className="flex justify-center py-8 text-sm text-muted-foreground">Cargando...</div>
        ) : (
          <PurchaseOrdersForm
            onSuccess={closeModal}
            onCancel={closeModal}
            defaultValues={mode === 'edit' && fullOrder ? apiToForm(fullOrder, defaultTax) : undefined}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

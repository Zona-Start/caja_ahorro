import { Badge } from '@repo/shadcn/badge';
import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader } from '@repo/shadcn/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/shadcn/dialog';
import { Separator } from '@repo/shadcn/separator';
import { useQuery } from '@tanstack/react-query';
import { FileText, ListOrdered, Calculator } from 'lucide-react';
import { useMemo } from 'react';
import { purchaseOrdersKeys } from '../keys';
import { PurchaseOrdersApi } from '../services/purchase-orders-api';
import { STATUS_LABELS, STATUS_VARIANTS, LINE_TYPES } from '../schemas/purchase-orders-options';

const CURRENCY_SYMBOLS: Record<string, string> = { VES: 'Bs.', USD: '$', EUR: '€' };

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId?: string;
}

export function PurchaseOrdersViewModal({ open, onOpenChange, orderId }: Props) {
  const { data: order, isLoading } = useQuery({
    queryKey: purchaseOrdersKeys.detail(orderId!),
    queryFn: () => PurchaseOrdersApi.getById(orderId!),
    enabled: !!orderId && open,
  });

  const sym = CURRENCY_SYMBOLS[order?.currencyCode ?? 'VES'];

  const lineTypeLabel = (v: string) => LINE_TYPES.find((lt) => lt.value === v)?.label || v;

  const itemsWithCalc = useMemo(() => {
    if (!order?.items) return [];
    return order.items.map((item) => {
      const qty = Number(item.quantity) || 0;
      const cost = Number(item.unitCost) || 0;
      const lineSub = qty * cost;
      return { ...item, lineSub, qty, cost };
    });
  }, [order?.items]);

  const totals = useMemo(() => {
    let sub = 0;
    (order?.items || []).forEach((item) => {
      sub += (Number(item.quantity) || 0) * (Number(item.unitCost) || 0);
    });
    const taxAmount = Number(order?.taxAmount) || 0;
    const totalAmount = Number(order?.totalAmount) || 0;
    return { subtotal: +sub.toFixed(2), taxAmount: +taxAmount.toFixed(2), totalAmount: +totalAmount.toFixed(2) };
  }, [order]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles de la Orden</DialogTitle>
          <DialogDescription>Información completa de la orden de compra.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-8 text-sm text-muted-foreground">Cargando...</div>
        ) : !order ? (
          <div className="flex justify-center py-8 text-sm text-muted-foreground">No se encontró la orden.</div>
        ) : (
          <div className="space-y-4">
            {/* Encabezado */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-semibold">Información General</h3>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <InfoRow label="N° Orden" value={order.orderNumber} />
                  <InfoRow label="Proveedor" value={order.supplierName || order.supplierId} />
                  <InfoRow label="Estado" value={
                    <Badge variant={STATUS_VARIANTS[order.status] || 'secondary'}>
                      {STATUS_LABELS[order.status] || order.status}
                    </Badge>
                  } />
                  <InfoRow label="Fecha Orden" value={typeof order.orderDate === 'string' ? order.orderDate.slice(0, 10) : '-'} />
                  <InfoRow label="Entrega Esperada" value={order.expectedDeliveryDate ? String(order.expectedDeliveryDate).slice(0, 10) : '-'} />
                  <InfoRow label="Moneda" value={order.currencyCode || 'VES'} />
                  {order.observations && (
                    <div className="col-span-full">
                      <InfoRow label="Observaciones" value={order.observations} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Ítems */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
                <ListOrdered className="h-5 w-5 text-green-600" />
                <h3 className="text-sm font-semibold">Ítems</h3>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2 pr-2">Tipo</th>
                        <th className="py-2 pr-2">Descripción</th>
                        <th className="py-2 pr-2 text-right">Cant</th>
                        <th className="py-2 pr-2 text-right">Costo Unit</th>
                        <th className="py-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsWithCalc.map((item) => (
                        <tr key={item.id} className="border-b last:border-0">
                          <td className="py-2 pr-2">{lineTypeLabel(item.lineType)}</td>
                          <td className="py-2 pr-2 max-w-[200px] truncate">{item.itemName || item.description || '-'}</td>
                          <td className="py-2 pr-2 text-right">{item.qty}</td>
                          <td className="py-2 pr-2 text-right">{sym} {item.cost.toFixed(2)}</td>
                          <td className="py-2 text-right font-medium">{sym} {item.lineSub.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Totales */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
                <Calculator className="h-5 w-5 text-purple-600" />
                <h3 className="text-sm font-semibold">Totales</h3>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal (sin IVA):</span><span>{sym} {totals.subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Impuesto (IVA):</span><span>{sym} {totals.taxAmount.toFixed(2)}</span></div>
                  <Separator />
                  <div className="flex justify-between text-base font-semibold"><span>Total:</span><span>{sym} {totals.totalAmount.toFixed(2)}</span></div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

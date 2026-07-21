import { Badge } from '@repo/shadcn/badge';
import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader } from '@repo/shadcn/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/shadcn/dialog';
import { Separator } from '@repo/shadcn/separator';
import { useQuery } from '@tanstack/react-query';
import { FileText, ListOrdered, Calculator, CreditCard } from 'lucide-react';
import { useMemo } from 'react';
import { SUPPLIER_INVOICES_KEYS } from '../keys/supplier-invoices-keys';
import { supplierInvoicesService } from '../services/supplier-invoices-service';
import { INVOICE_STATUS_LABELS, PAYMENT_TYPE_LABELS, PAYMENT_METHOD_LABELS, LINE_TYPE_LABELS } from '../schemas/supplier-invoice-options';

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  DRAFT: 'secondary',
  APPROVED: 'default',
  PARTIALLY_PAID: 'outline',
  PAID: 'default',
  CANCELLED: 'destructive',
};

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
  invoiceId?: string;
}

export function SupplierInvoicesViewModal({ open, onOpenChange, invoiceId }: Props) {
  const { data: invoice, isLoading } = useQuery({
    queryKey: SUPPLIER_INVOICES_KEYS.detail(invoiceId as unknown as number),
    queryFn: () => supplierInvoicesService.getById(invoiceId as unknown as number),
    enabled: !!invoiceId && open,
  });

  const sym = CURRENCY_SYMBOLS[invoice?.currencyCode ?? 'VES'];

  const itemsWithCalc = useMemo(() => {
    if (!invoice?.items) return [];
    return invoice.items.map((item) => {
      const qty = Number(item.quantity) || 0;
      const cost = Number(item.unitCost) || 0;
      return { ...item, lineSub: qty * cost, qty, cost };
    });
  }, [invoice?.items]);

  const totals = useMemo(() => {
    let sub = 0;
    (invoice?.items || []).forEach((item) => {
      sub += (Number(item.quantity) || 0) * (Number(item.unitCost) || 0);
    });
    return {
      subtotal: +sub.toFixed(2),
      taxAmount: +(Number(invoice?.taxAmount) || 0).toFixed(2),
      totalAmount: +(Number(invoice?.totalAmount) || 0).toFixed(2),
    };
  }, [invoice]);

  const lineTypeLabel = (v: string) => LINE_TYPE_LABELS[v as keyof typeof LINE_TYPE_LABELS] || v;
  const paymentLabel = (v: string) => PAYMENT_TYPE_LABELS[v as keyof typeof PAYMENT_TYPE_LABELS] || v;
  const methodLabel = (v: string) => PAYMENT_METHOD_LABELS[v as keyof typeof PAYMENT_METHOD_LABELS] || v;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles de la Factura</DialogTitle>
          <DialogDescription>Información completa de la factura de proveedor.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-8 text-sm text-muted-foreground">Cargando...</div>
        ) : !invoice ? (
          <div className="flex justify-center py-8 text-sm text-muted-foreground">No se encontró la factura.</div>
        ) : (
          <div className="space-y-4">
            {/* Información General */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-semibold">Información General</h3>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <InfoRow label="N° Factura" value={invoice.invoiceNumber} />
                  <InfoRow label="Proveedor" value={invoice.supplier?.name || invoice.supplierId} />
                  <InfoRow label="Estado" value={
                    <Badge variant={STATUS_VARIANTS[invoice.status] || 'secondary'}>
                      {INVOICE_STATUS_LABELS[invoice.status as keyof typeof INVOICE_STATUS_LABELS] || invoice.status}
                    </Badge>
                  } />
                  <InfoRow label="Fecha Factura" value={typeof invoice.invoiceDate === 'string' ? invoice.invoiceDate.slice(0, 10) : '-'} />
                  <InfoRow label="N° Control" value={invoice.controlNumber || '—'} />
                  <InfoRow label="Moneda" value={invoice.currencyCode || 'VES'} />
                  {invoice.dueDate && (
                    <InfoRow label="Fecha Vencimiento" value={typeof invoice.dueDate === 'string' ? invoice.dueDate.slice(0, 10) : '-'} />
                  )}
                  {invoice.observations && (
                    <div className="col-span-full">
                      <InfoRow label="Observaciones" value={invoice.observations} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Información de Pago */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
                <CreditCard className="h-5 w-5 text-orange-600" />
                <h3 className="text-sm font-semibold">Información de Pago</h3>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <InfoRow label="Tipo de Pago" value={paymentLabel(invoice.paymentType)} />
                  {invoice.paymentMethod && (
                    <InfoRow label="Método de Pago" value={methodLabel(invoice.paymentMethod)} />
                  )}
                  {invoice.bankReference && (
                    <InfoRow label="Referencia Bancaria" value={invoice.bankReference} />
                  )}
                  {invoice.purchaseOrder && (
                    <InfoRow label="Orden de Compra" value={invoice.purchaseOrder.orderNumber} />
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
                          <td className="py-2 pr-2 max-w-[200px] truncate">{item.description || '-'}</td>
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

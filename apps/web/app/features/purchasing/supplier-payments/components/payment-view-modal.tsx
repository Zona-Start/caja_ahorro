import { Badge } from '@repo/shadcn/badge';
import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader } from '@repo/shadcn/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/shadcn/dialog';
import { Separator } from '@repo/shadcn/separator';
import { formatCurrency } from '@/lib/format-utils';
import { format } from 'date-fns';
import { FileText, CreditCard, ListOrdered } from 'lucide-react';
import { PAYMENT_METHOD_LABELS } from '../schemas/supplier-payment-options';
import type { SupplierPaymentApi } from '../schemas/supplier-payment-api.schema';

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  PROCESSED: 'default',
  DRAFT: 'secondary',
  REVERSED: 'destructive',
  PENDING: 'outline',
};

const STATUS_LABELS: Record<string, string> = {
  PROCESSED: 'Procesado',
  DRAFT: 'Borrador',
  REVERSED: 'Reversado',
  PENDING: 'Pendiente',
};

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
  payment: SupplierPaymentApi | null;
}

export function PaymentViewModal({ open, onOpenChange, payment }: Props) {
  if (!payment) return null;

  const lines = payment.lines || [];
  const isAdvance = lines.some((l) => l.relatedAdvanceId && !l.accountsPayableId);
  const isCxP = lines.some((l) => l.accountsPayableId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Pago</DialogTitle>
          <DialogDescription>
            Información completa del pago {payment.paymentNumber}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
              <FileText className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-semibold">Información General</h3>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <InfoRow label="N° Pago" value={payment.paymentNumber || '—'} />
                <InfoRow label="Proveedor" value={payment.supplierName || '—'} />
                <InfoRow label="Tipo" value={
                  <Badge variant={isAdvance ? 'secondary' : 'default'}>
                    {isAdvance ? 'Anticipo' : isCxP ? 'Cuenta por Pagar' : 'N/D'}
                  </Badge>
                } />
                <InfoRow label="Estado" value={
                  <Badge variant={STATUS_VARIANTS[payment.status] || 'secondary'}>
                    {STATUS_LABELS[payment.status] || payment.status}
                  </Badge>
                } />
                <InfoRow label="Monto" value={formatCurrency(payment.totalAmount, 'VES')} />
                <InfoRow label="Método" value={
                  PAYMENT_METHOD_LABELS[payment.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS] || payment.paymentMethod
                } />
                {payment.bankReference && (
                  <InfoRow label="Ref. Bancaria" value={payment.bankReference} />
                )}
                <InfoRow label="CxP Asociada" value={payment.accountPayableNumber || '—'} />
                <InfoRow label="Fecha Solicitud" value={
                  payment.requestedAt ? format(new Date(payment.requestedAt), 'dd/MM/yyyy') : '—'
                } />
                <InfoRow label="Fecha Procesado" value={
                  payment.processedAt ? format(new Date(payment.processedAt), 'dd/MM/yyyy') : '—'
                } />
                {payment.reversedAt && (
                  <InfoRow label="Fecha Reversa" value={format(new Date(payment.reversedAt), 'dd/MM/yyyy')} />
                )}
              </div>
              {payment.observations && (
                <div className="mt-3">
                  <InfoRow label="Observaciones" value={payment.observations} />
                </div>
              )}
            </CardContent>
          </Card>

          {lines.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
                <ListOrdered className="h-5 w-5 text-green-600" />
                <h3 className="text-sm font-semibold">Líneas del Pago</h3>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2 pr-2">Tipo</th>
                        <th className="py-2 pr-2">Descripción</th>
                        <th className="py-2 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 pr-2">
                            <Badge variant={line.accountsPayableId ? 'default' : 'secondary'}>
                              {line.accountsPayableId ? 'CxP' : 'Anticipo'}
                            </Badge>
                          </td>
                          <td className="py-2 pr-2 text-xs">{line.description || '—'}</td>
                          <td className="py-2 text-right font-medium">
                            {formatCurrency(line.amount, 'VES')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

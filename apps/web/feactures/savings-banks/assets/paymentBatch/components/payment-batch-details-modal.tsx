'use client';

import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { useQueryPaymentBatchDetails } from '../hooks/use-query-payment-batch';
import { PAYMENT_BATCH_STATUS } from '../schemas/payment-batch-options';
import { Badge } from '@repo/shadcn/badge';
import { DataTableSkeleton } from '@repo/shadcn/components/ui/table/data-table-skeleton';
import { format } from 'date-fns';

interface PaymentBatchDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentBatchId: number;
}

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode | string | number | null | undefined;
}) => (
  <div className="flex justify-between items-center py-2 border-b border-border/50">
    <p className="text-sm text-muted-foreground">{label}</p>
    <div className="text-sm font-medium text-right">{value || 'N/A'}</div>
  </div>
);

export function PaymentBatchDetailsModal({
  isOpen,
  onClose,
  paymentBatchId,
}: PaymentBatchDetailsModalProps) {
  const { data: paymentBatch, isLoading } = useQueryPaymentBatchDetails(
    paymentBatchId,
  );

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DataTableSkeleton columnCount={2} rowCount={5} />
        </DialogContent>
      </Dialog>
    );
  }

  if (!paymentBatch) return null;

  const formatCurrency = (amount: string | null | undefined) => {
    const num = Number(amount);
    if (isNaN(num)) return 'N/A';
    return `${num.toFixed(2)} ${paymentBatch.currencyCode}`;
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'dd/MM/yyyy HH:mm');
  };

  const statusLabel =
    PAYMENT_BATCH_STATUS[
      paymentBatch.status as keyof typeof PAYMENT_BATCH_STATUS
    ] || paymentBatch.status;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Lote de Pago</DialogTitle>
          <DialogDescription>
            ID del Lote: {paymentBatch.id}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <DetailItem label="Descripción" value={paymentBatch.description} />
              <DetailItem label="Estado" value={<Badge>{statusLabel}</Badge>} />
              <DetailItem
                label="Monto Total"
                value={formatCurrency(paymentBatch.totalAmount)}
              />
              <DetailItem label="Cantidad de Ítems" value={paymentBatch.recordCount} />
              <DetailItem label="Moneda" value={paymentBatch.currencyCode} />
              <DetailItem label="Banco" value={paymentBatch.bank?.name || 'N/A'} />
              <DetailItem
                label="Referencia Bancaria"
                value={paymentBatch.bankReference}
              />
              <DetailItem
                label="Fecha de Procesamiento"
                value={formatDate(paymentBatch.processedAt)}
              />
              <DetailItem
                label="Fecha de Creación"
                value={formatDate(paymentBatch.createdAt)}
              />
            </CardContent>
          </Card>

          {paymentBatch.items && paymentBatch.items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Ítems del Lote</CardTitle>
              </CardHeader>
              <CardContent>
                {paymentBatch.items.map((item) => (
                  <div
                    key={item.id}
                    className="border-b border-border/50 pb-2 mb-2 last:border-b-0 last:mb-0"
                  >
                    <DetailItem label="Tipo" value={item.itemType} />
                    <DetailItem label="ID Origen" value={item.sourceId} />
                    <DetailItem
                      label="Beneficiario"
                      value={item.beneficiaryName}
                    />
                    <DetailItem
                      label="Cuenta Beneficiario"
                      value={item.beneficiaryAccountNumber}
                    />
                    <DetailItem
                      label="Monto"
                      value={formatCurrency(item.amount)}
                    />
                    <DetailItem label="Estado Ítem" value={item.status} />
                    {item.rejectionReason && (
                      <DetailItem
                        label="Razón de Rechazo"
                        value={item.rejectionReason}
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

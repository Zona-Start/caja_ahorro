import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Badge } from '@repo/shadcn/badge';
import { Skeleton } from '@repo/shadcn/skeleton';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/format-utils';
import { useQueryPaymentBatchDetail } from '../hooks/use-payment-batch-query';
import {
  PAYMENT_BATCH_STATUS,
  PAYMENT_BATCH_ITEM_TYPE,
} from '../schemas/payment-batch-options';
import type { PaymentBatch, PaymentBatchItem } from '../services/payment-batch-service';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchId: string | null;
}

export function PaymentBatchDetailModal({ isOpen, onClose, batchId }: DetailModalProps) {
  const { data: batch, isLoading } = useQueryPaymentBatchDetail(
    batchId || '',
    { enabled: isOpen && !!batchId },
  );

  const statusVariant: Record<string, string> = {
    DRAFT: 'secondary',
    UPLOADED: 'warning',
    PROCESSED: 'success',
    CANCELLED: 'destructive',
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Detalle del Lote</DialogTitle>
          <DialogDescription>
            {batch?.paymentBatchReference || 'Cargando...'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {isLoading || !batch ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-[200px] w-full" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-xs text-muted-foreground">Referencia</span>
                  <p className="font-medium text-sm">{batch.paymentBatchReference}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Estatus</span>
                  <p>
                    <Badge variant={(statusVariant[batch.status] || 'default') as any} className="mt-0.5">
                      {PAYMENT_BATCH_STATUS[batch.status as keyof typeof PAYMENT_BATCH_STATUS] || batch.status}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Moneda</span>
                  <p className="text-sm">{batch.currencyCode}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Monto Total</span>
                  <p className="font-medium text-sm">
                    {formatCurrency(Number(batch.totalAmount), batch.currencyCode as 'VES' | 'USD')}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Registros</span>
                  <p className="text-sm">{batch.recordCount}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">F. Creación</span>
                  <p className="text-sm">
                    {format(new Date(batch.createdAt), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
                {batch.bank && (
                  <div className="col-span-2">
                    <span className="text-xs text-muted-foreground">Cuenta Bancaria</span>
                    <p className="text-sm">{batch.bank.name} — {batch.bank.accountNumber}</p>
                  </div>
                )}
                {batch.description && (
                  <div className="col-span-2">
                    <span className="text-xs text-muted-foreground">Descripción</span>
                    <p className="text-sm">{batch.description}</p>
                  </div>
                )}
                {batch.bankReference && (
                  <div>
                    <span className="text-xs text-muted-foreground">Ref. Bancaria</span>
                    <p className="text-sm">{batch.bankReference}</p>
                  </div>
                )}
                {batch.processedAt && (
                  <div>
                    <span className="text-xs text-muted-foreground">F. Procesado</span>
                    <p className="text-sm">
                      {format(new Date(batch.processedAt), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">
                  Registros del Lote ({batch.items?.length || 0})
                </h4>
                <div className="border rounded-md max-h-[300px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-2 font-medium">Beneficiario</th>
                        <th className="text-left p-2 font-medium">Tipo</th>
                        <th className="text-right p-2 font-medium">Monto</th>
                        <th className="text-center p-2 font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(batch.items || []).map((item: PaymentBatchItem) => {
                        const typeLabel =
                          PAYMENT_BATCH_ITEM_TYPE[
                            item.itemType as keyof typeof PAYMENT_BATCH_ITEM_TYPE
                          ] || item.itemType;

                        const itemStatusVariant: Record<string, string> = {
                          PENDING: 'secondary',
                          PROCESSED: 'success',
                          REJECTED: 'destructive',
                        };

                        return (
                          <tr key={item.id} className="border-b last:border-b-0 hover:bg-muted/30">
                            <td className="p-2">
                              <div className="flex flex-col">
                                <span className="font-medium">{item.beneficiaryName}</span>
                                <span className="text-xs text-muted-foreground">
                                  {item.beneficiaryId}
                                </span>
                              </div>
                            </td>
                            <td className="p-2">
                              <Badge variant="outline" className="text-xs">
                                {typeLabel}
                              </Badge>
                            </td>
                            <td className="p-2 text-right font-medium">
                              {formatCurrency(Number(item.amount), 'VES')}
                            </td>
                            <td className="p-2 text-center">
                              <Badge variant={(itemStatusVariant[item.status] || 'default') as any} className="text-xs">
                                {item.status === 'REJECTED' && item.rejectionReason
                                  ? 'Rechazado'
                                  : item.status === 'PROCESSED'
                                    ? 'Procesado'
                                    : 'Pendiente'}
                              </Badge>
                              {item.status === 'REJECTED' && item.rejectionReason && (
                                <p className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate">
                                  {item.rejectionReason}
                                </p>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Button } from '@repo/shadcn/button';
import { Input } from '@repo/shadcn/input';
import { Label } from '@repo/shadcn/label';
import { Textarea } from '@repo/shadcn/textarea';
import { Checkbox } from '@repo/shadcn/checkbox';
import { Badge } from '@repo/shadcn/badge';
import { Skeleton } from '@repo/shadcn/skeleton';
import { formatCurrency } from '@/lib/format-utils';
import { usePaymentBatchModalStore } from '../store/payment-batch-store';
import { useConfirmPaymentBatchMutation } from '../hooks/use-payment-batch-mutation';
import { useQueryPaymentBatchDetail } from '../hooks/use-payment-batch-query';
import { PAYMENT_BATCH_ITEM_TYPE } from '../schemas/payment-batch-options';
import type { PaymentBatchItem } from '../services/payment-batch-service';

export function ConfirmBatchModal() {
  const { isConfirmOpen, closeConfirmModal, confirmBatchId } =
    usePaymentBatchModalStore();
  const { mutate: confirm, isPending } = useConfirmPaymentBatchMutation();

  const { data: batch, isLoading } = useQueryPaymentBatchDetail(
    confirmBatchId || '',
    { enabled: isConfirmOpen && !!confirmBatchId },
  );

  const [bankReference, setBankReference] = useState('');
  const [processedAt, setProcessedAt] = useState(
    new Date().toISOString().slice(0, 16),
  );
  const [processedIds, setProcessedIds] = useState<Record<string, boolean>>({});
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});

  useEffect(() => {
    if (batch?.items) {
      const initial: Record<string, boolean> = {};
      for (const item of batch.items) {
        if (item.status !== 'PROCESSED') {
          initial[item.id] = true;
        }
      }
      setProcessedIds(initial);
      setRejectionReasons({});
    }
  }, [batch]);

  const handleConfirm = () => {
    if (!confirmBatchId) return;
    const items = (batch?.items || []).map((item) => ({
      itemId: item.id,
      processed: processedIds[item.id] ?? false,
      rejectionReason: processedIds[item.id]
        ? undefined
        : rejectionReasons[item.id] || undefined,
    }));

    confirm(
      {
        id: confirmBatchId,
        dto: {
          processedAt: new Date(processedAt).toISOString(),
          bankReference: bankReference || undefined,
          items,
        },
      },
      {
        onSuccess: () => {
          closeConfirmModal();
          setBankReference('');
          setProcessedAt(new Date().toISOString().slice(0, 16));
          setProcessedIds({});
          setRejectionReasons({});
        },
      },
    );
  };

  const handleClose = () => {
    if (!isPending) {
      closeConfirmModal();
      setBankReference('');
      setProcessedIds({});
      setRejectionReasons({});
    }
  };

  const toggleItem = (id: string) => {
    setProcessedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const selectedCount = Object.values(processedIds).filter(Boolean).length;
  const totalCount = batch?.items?.length || 0;
  const rejectedCount = totalCount - selectedCount;

  return (
    <Dialog open={isConfirmOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Confirmar Procesamiento</DialogTitle>
          <DialogDescription>
            Seleccione los registros procesados por el banco y agregue observaciones a los rechazados.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bank-reference">Referencia Bancaria</Label>
              <Input
                id="bank-reference"
                placeholder="Número de referencia"
                value={bankReference}
                onChange={(e) => setBankReference(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="processed-at">Fecha de Procesamiento</Label>
              <Input
                id="processed-at"
                type="datetime-local"
                value={processedAt}
                onChange={(e) => setProcessedAt(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Registros del Lote</Label>
              <div className="flex gap-2 text-sm">
                <Badge variant="success">{selectedCount} procesados</Badge>
                {rejectedCount > 0 && (
                  <Badge variant="destructive">{rejectedCount} rechazados</Badge>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <div className="border rounded-md max-h-[300px] overflow-y-auto">
                {(batch?.items || []).map((item: PaymentBatchItem) => {
                  const isProcessed = processedIds[item.id] ?? false;
                  const typeLabel =
                    PAYMENT_BATCH_ITEM_TYPE[
                      item.itemType as keyof typeof PAYMENT_BATCH_ITEM_TYPE
                    ] || item.itemType;

                  return (
                    <div
                      key={item.id}
                      className="border-b last:border-b-0 p-3 space-y-2"
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={`item-${item.id}`}
                          checked={isProcessed}
                          onCheckedChange={() => toggleItem(item.id)}
                          disabled={isPending}
                        />
                        <div className="flex-1 min-w-0">
                          <label
                            htmlFor={`item-${item.id}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {item.beneficiaryName}
                          </label>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <Badge variant="outline" className="text-xs px-1">
                              {typeLabel}
                            </Badge>
                            <span>{item.beneficiaryId}</span>
                            <span className="font-medium">
                              {formatCurrency(Number(item.amount), 'VES')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {!isProcessed && (
                        <div className="pl-8">
                          <Textarea
                            placeholder="Motivo del rechazo (opcional)"
                            className="h-16 text-xs"
                            value={rejectionReasons[item.id] || ''}
                            onChange={(e) =>
                              setRejectionReasons((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                            disabled={isPending}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isPending || totalCount === 0}>
            {isPending ? 'Procesando...' : 'Confirmar Lote'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

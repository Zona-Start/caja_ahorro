'use client';

import { Button } from '@repo/shadcn/button';
import { CustomCalendar } from '@repo/shadcn/components/ui/custom-calendar';
import { DataTableSkeleton } from '@repo/shadcn/components/ui/table/data-table-skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Input } from '@repo/shadcn/input';
import { Label } from '@repo/shadcn/label';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { useQueryPaymentBatchDetails } from '../hooks/use-query-payment-batch';
import {
  ConfirmPaymentBatch,
  itemResultSchema,
} from '../schemas/payment-batch.schema';
import { ConfirmItemsTable } from './confirm-items-table';

type ItemResult = z.infer<typeof itemResultSchema>;

interface ConfirmPaymentBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dto: ConfirmPaymentBatch) => void;
  paymentBatchId: number;
  loading: boolean;
}

export function ConfirmPaymentBatchModal({
  isOpen,
  onClose,
  onConfirm,
  paymentBatchId,
  loading,
}: ConfirmPaymentBatchModalProps) {
  const { data: paymentBatch, isLoading } = useQueryPaymentBatchDetails(
    paymentBatchId,
    isOpen, // Only fetch when the modal is open
  );

  const [bankReference, setBankReference] = useState<string>('');
  const [processedAt, setProcessedAt] = useState<Date | null>(null);
  const [itemResults, setItemResults] = useState<ItemResult[]>([]);

  useEffect(() => {
    if (paymentBatch?.items) {
      const initialResults = paymentBatch.items.map((item) => ({
        itemId: item.id,
        status: 'PROCESSED' as const,
        reason: '',
      }));
      setItemResults(initialResults);
    }
  }, [paymentBatch]);

  const handleConfirm = () => {
    if (!processedAt) {
      // Handle error: processedAt is required
      return;
    }

    onConfirm({
      bankReference: bankReference || undefined,
      processedAt: processedAt.toISOString(),
      items: itemResults.map((r) => ({
        ...r,
        reason: r.status === 'REJECTED' ? r.reason : null,
      })),
    });
  };

  const rejectedItemsCount = itemResults.filter(
    (r) => r.status === 'REJECTED',
  ).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Confirmar Lote de Pago #{paymentBatchId}</DialogTitle>
          <DialogDescription>
            Ingrese la referencia bancaria, la fecha de procesamiento y confirme
            el estado de los ítems.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankReference">Referencia Bancaria</Label>
              <Input
                id="bankReference"
                value={bankReference}
                onChange={(e) => setBankReference(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="processedAt">Fecha de Procesamiento</Label>
              <CustomCalendar
                value={processedAt}
                onChange={setProcessedAt}
                placeholder="Seleccione la fecha"
                disabled={loading}
              />
            </div>
          </div>

          {isLoading ? (
            <DataTableSkeleton columnCount={4} rowCount={5} />
          ) : (
            <ConfirmItemsTable
              items={paymentBatch?.items || []}
              initialResults={itemResults}
              onResultsChange={setItemResults}
              disabled={loading}
            />
          )}

          {rejectedItemsCount > 0 && (
            <div className="text-sm text-destructive">
              {rejectedItemsCount} ítem(s) será(n) marcado(s) como rechazado(s).
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={loading || !processedAt || itemResults.length === 0}
          >
            {loading ? 'Confirmando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

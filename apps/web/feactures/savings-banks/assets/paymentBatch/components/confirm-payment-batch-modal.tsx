'use client';

import { Button } from '@repo/shadcn/button';
import { CustomCalendar } from '@repo/shadcn/components/ui/custom-calendar';
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
import { useState } from 'react';
import { ConfirmPaymentBatch } from '../schemas/payment-batch.schema';

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
  const [bankReference, setBankReference] = useState<string>('');
  const [processedAt, setProcessedAt] = useState<Date | null>(null);

  // TODO: Implement item results input if partial rejections are to be handled via this modal

  const handleConfirm = () => {
    if (!processedAt) {
      // Handle error: processedAt is required
      return;
    }
    onConfirm({
      bankReference: bankReference || undefined,
      processedAt: processedAt.toISOString(),
      items: [], // TODO: Populate with actual item results
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar Lote de Pago #{paymentBatchId}</DialogTitle>
          <DialogDescription>
            Ingrese la referencia bancaria y la fecha de procesamiento.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bankReference" className="text-right">
              Referencia Bancaria
            </Label>
            <Input
              id="bankReference"
              value={bankReference}
              onChange={(e) => setBankReference(e.target.value)}
              className="col-span-3"
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="processedAt" className="text-right">
              Fecha de Procesamiento
            </Label>
            <div className="col-span-3">
              <CustomCalendar
                value={processedAt}
                onChange={setProcessedAt}
                placeholder="Seleccione la fecha"
                disabled={loading}
              />
            </div>
          </div>
          {/* TODO: Add UI for item results if needed */}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={loading || !processedAt}
          >
            {loading ? 'Confirmando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

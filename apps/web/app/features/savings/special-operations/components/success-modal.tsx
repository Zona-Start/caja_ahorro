'use client';

import { formatCurrency } from '@/lib/format-utils';
import { Button } from '@repo/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { CheckCircle2, FileText, Plus } from 'lucide-react';
import { type ExecuteSpecialOperationResponse } from '../schemas/special-operations.schema';

export function SpecialOperationSuccessModal({
  open,
  onOpenChange,
  result,
  onNewOperation,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: ExecuteSpecialOperationResponse | null;
  onNewOperation: () => void;
}) {
  if (!result) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <DialogTitle>Operación ejecutada correctamente</DialogTitle>
          <DialogDescription>
            La operación especial fue procesada y el asiento contable fue
            generado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-lg border bg-muted/30 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Referencia</span>
            <span className="font-medium">{result.reference}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Asociados</span>
            <span className="font-medium">{result.totalAssociates}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total operado</span>
            <span className="font-medium">
              {formatCurrency(result.totalAmount, 'VES')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Asiento</span>
            <span className="font-medium">
              Nro. {result.voucherNo}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onNewOperation();
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva operación
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            <FileText className="mr-2 h-4 w-4" />
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

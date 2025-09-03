'use client';

import { Button } from '@repo/shadcn/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/components/ui/dialog';
import { ScrollArea } from '@repo/shadcn/scroll-area';
import { AccountPayableSchemaAPI } from '../schemas';
import { ACCOUNT_PAYABLE_STATUS_TYPES } from '../schemas/account-payable-options';

interface AccountPayableViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: AccountPayableSchemaAPI;
}

export function AccountPayableViewModal({
  open,
  onOpenChange,
  data,
}: AccountPayableViewModalProps) {
  const statusText =
    ACCOUNT_PAYABLE_STATUS_TYPES[
      data.status as keyof typeof ACCOUNT_PAYABLE_STATUS_TYPES
    ] || data.status;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Detalles de la Cuenta por Pagar</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] p-4">
          <div className="grid grid-cols-1 gap-4 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <p className="font-semibold">Número de Referencia:</p>
              <p>{data.accountsPayableNumber}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <p className="font-semibold">Factura de Proveedor:</p>
              <p>{data.supplierInvoice?.invoiceNumber || 'N/A'}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <p className="font-semibold">Proveedor:</p>
              <p>{data.supplierInvoice?.supplierName || 'N/A'}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <p className="font-semibold">Monto Original:</p>
              <p>{Number(data.originalAmount).toFixed(2)} Bs</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <p className="font-semibold">Monto Pagado:</p>
              <p>{Number(data.paidAmount || 0).toFixed(2)} Bs</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <p className="font-semibold">Monto Restante:</p>
              <p>{Number(data.remainingAmount).toFixed(2)} Bs</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <p className="font-semibold">Estatus:</p>
              <p>{statusText}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <p className="font-semibold">Fecha de Vencimiento: </p>
              <p>
                {data.dueDate
                  ? new Date(data.dueDate).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <p className="font-semibold">Observaciones:</p>
              <p>{data.observations || 'N/A'}</p>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

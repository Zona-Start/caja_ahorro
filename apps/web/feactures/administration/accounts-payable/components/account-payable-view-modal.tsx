'use client';

import { Button } from '@repo/shadcn/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/components/ui/dialog';
import { AccountPayableSchemaAPI } from '../schemas';
import { AccountPayableDetails } from './account-payable-details';

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Detalles de la Cuenta por Pagar</DialogTitle>
        </DialogHeader>
        <AccountPayableDetails accountPayable={data} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { Button } from '@repo/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import type { AccountingBalance } from '../../schemas/accounting-balance.schema';

interface AccountBalanceDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: AccountingBalance | null;
}

export function AccountBalanceDetailModal({
  open,
  onOpenChange,
  data,
}: AccountBalanceDetailModalProps) {
  if (!data) return null;

  const fmt = (value: string) => {
    const n = Number(value);
    if (isNaN(n)) return value;
    return n.toLocaleString('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Detalle de Cuenta</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Código</span>
              <p className="font-medium">{data.accountCode}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Naturaleza</span>
              <p className="font-medium">
                {data.accountNature === 'DEBIT' ? 'Deudora' : 'Acreedora'}
              </p>
            </div>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Nombre</span>
            <p className="font-medium">{data.accountName}</p>
          </div>
          <div className="border-t pt-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Saldo Inicial
              </span>
              <span className="font-mono font-medium">
                {fmt(data.initialBalance)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Débitos del Período
              </span>
              <span className="font-mono font-medium">
                {fmt(data.debitBalance)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Créditos del Período
              </span>
              <span className="font-mono font-medium">
                {fmt(data.creditBalance)}
              </span>
            </div>
          </div>
          <div className="flex justify-between border-t pt-4">
            <span className="text-base font-bold">Saldo Final</span>
            <span className="font-mono text-base font-bold">
              {fmt(data.finalBalance)}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

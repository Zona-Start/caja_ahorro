import { Badge } from '@repo/shadcn/badge';
import { Button } from '@repo/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { useAccountingAccounts } from '../hooks/use-accounting-accounts-query';
import type { AccountPlanApiResponse } from '../schemas/account-plan-api';
import {
  ACCOUNT_LEVELS,
  ACCOUNT_TYPES,
  NATURE_TYPE,
} from '../schemas/account-plan-options';

interface AccountPlanDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: AccountPlanApiResponse;
}

export function AccountPlanDetailModal({
  open,
  onOpenChange,
  data,
}: AccountPlanDetailModalProps) {
  const { data: accounts } = useAccountingAccounts();

  const parentAccount = data.parentAccountId && accounts
    ? accounts.find((a) => a.id === data.parentAccountId)
    : null;

  const accountTypeLabel =
    ACCOUNT_TYPES[data.accountType as keyof typeof ACCOUNT_TYPES] ||
    data.accountType;

  const natureLabel =
    data.nature
      ? NATURE_TYPE[data.nature as keyof typeof NATURE_TYPE] || data.nature
      : 'N/A';

  const levelLabel =
    data.level != null
      ? ACCOUNT_LEVELS[
          (typeof data.level === 'string' ? Number(data.level) : data.level) as keyof typeof ACCOUNT_LEVELS
        ] || String(data.level)
      : 'N/A';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Información de Cuenta Contable</DialogTitle>
          <DialogDescription>
            Detalle completo de la cuenta contable seleccionada.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 overflow-y-auto flex-1">
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Código
                </label>
                <p className="text-sm font-mono mt-1">{data.code}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Nombre
                </label>
                <p className="text-sm mt-1">{data.name}</p>
              </div>
            </div>

            {data.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Descripción
                </label>
                <p className="text-sm mt-1">{data.description}</p>
              </div>
            )}
          </div>

          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <h4 className="text-sm font-semibold">Clasificación</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Tipo de Cuenta
                </label>
                <div className="mt-1">
                  <Badge variant="secondary">{accountTypeLabel}</Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Naturaleza
                </label>
                <div className="mt-1">
                  <Badge
                    variant={
                      data.nature === 'DEBIT' ? 'default' : 'outline'
                    }
                  >
                    {natureLabel}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Nivel
                </label>
                <div className="mt-1">
                  <Badge variant="secondary">{levelLabel}</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Acepta Movimientos
                </label>
                <p className="text-sm mt-1">
                  {data.allowsMovements ? 'Sí' : 'No'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Estado
                </label>
                <div className="mt-1">
                  <Badge variant={data.isActive ? 'success' : 'destructive'}>
                    {data.isActive ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <h4 className="text-sm font-semibold">Jerarquía</h4>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Cuenta Padre
              </label>
              {parentAccount ? (
                <p className="text-sm mt-1">
                  <span className="font-mono">{parentAccount.code}</span>
                  <span className="mx-2">-</span>
                  {parentAccount.name}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  No aplica (cuenta raíz)
                </p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

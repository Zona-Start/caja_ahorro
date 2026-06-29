import { Badge } from '@repo/shadcn/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import type { AccountingCycle } from '../schemas/accounting-cycle.schema';
import { CYCLE_STATUS_OPTIONS } from '../schemas/accounting-cycle-options';

interface AccountingCycleDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: AccountingCycle;
}

export function AccountingCycleDetailModal({
  open,
  onOpenChange,
  data,
}: AccountingCycleDetailModalProps) {
  const statusLabel = CYCLE_STATUS_OPTIONS[data.status] || data.status;

  const statusVariant = (() => {
    switch (data.status) {
      case 'OPEN':
        return 'success' as const;
      case 'PENDING':
        return 'warning' as const;
      case 'CLOSED':
        return 'destructive' as const;
      default:
        return 'default' as const;
    }
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Información del Ciclo Contable</DialogTitle>
          <DialogDescription>
            Detalle completo del ciclo contable seleccionado.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Descripción
              </label>
              <p className="text-sm mt-1">{data.description}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Estado
              </label>
              <div className="mt-1">
                <Badge variant={statusVariant}>{statusLabel}</Badge>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Fecha de Inicio
              </label>
              <p className="text-sm mt-1">{data.startDate}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Fecha de Fin
              </label>
              <p className="text-sm mt-1">{data.endDate}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Fecha de Creación
              </label>
              <p className="text-sm mt-1">
                {data.createdAt
                  ? new Date(data.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Última Actualización
              </label>
              <p className="text-sm mt-1">
                {data.updatedAt
                  ? new Date(data.updatedAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

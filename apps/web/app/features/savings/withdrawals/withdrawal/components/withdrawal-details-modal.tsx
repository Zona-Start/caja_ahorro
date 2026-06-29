'use client';

import { Eye } from 'lucide-react';
import { Separator } from '@repo/shadcn/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { type WithdrawalPaymentApi } from '../schemas/withdrawal-api-response';
import { ESTATUS_TYPES, PAYMENT_METHOD } from '../schemas/withdrawal-options';
import { Badge } from '@repo/shadcn/badge';
import { cn } from '@repo/shadcn/lib/utils';
import { formatCurrency } from '@/lib/format-utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: WithdrawalPaymentApi | null;
}

export function WithdrawalDetailsModal({ open, onOpenChange, data }: Props) {
  if (!data) return null;

  const statusText =
    ESTATUS_TYPES[data.status as keyof typeof ESTATUS_TYPES] || data.status;
  const variant = (() => {
    switch (data.status) {
      case 'REQUESTED': return 'default';
      case 'APPROVED': return 'warning';
      case 'DISBURSED': case 'PROCESSED': return 'success';
      case 'CANCELLED': case 'REJECTED': return 'destructive';
      default: return 'default';
    }
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" /> Detalles del Retiro
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="rounded-lg border p-4 bg-muted/30">
            <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-3">
              Datos del Asociado
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Nombre y Apellido:</span>
                <span className="text-sm font-bold">{data.associateFullname || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Cédula:</span>
                <span className="text-sm font-mono">{data.associateCedula || '—'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4 bg-muted/30">
            <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-3">
              Detalles del Retiro
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tipo:</span>
                <span className="text-sm">{data.withdrawalType || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Referencia:</span>
                <span className="text-sm font-mono">{data.customReference || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Fecha:</span>
                <span className="text-sm">
                  {data.withdrawalDate
                    ? new Date(data.withdrawalDate).toLocaleDateString('es-VE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Método:</span>
                <span className="text-sm">
                  {PAYMENT_METHOD[data.paymentMethod as keyof typeof PAYMENT_METHOD] || data.paymentMethod || '—'}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Monto Solicitado:</span>
                <span className="text-sm font-mono font-bold">
                  {formatCurrency(Number(data.requestedAmount ?? 0), 'VES')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Comisión Admin:</span>
                <span className="text-sm font-mono">
                  {formatCurrency(Number(data.administrativeFee ?? 0), 'VES')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Desembolsado:</span>
                <span className="text-sm font-mono font-bold">
                  {formatCurrency(Number(data.disbursedAmount ?? 0), 'VES')}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Estado:</span>
                <div className={cn('p-2 h-full w-full flex justify-end')}>
                  <Badge variant={variant as any}>{statusText}</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

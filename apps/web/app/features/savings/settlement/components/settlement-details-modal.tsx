'use client';

import { Eye } from 'lucide-react';
import { Separator } from '@repo/shadcn/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Button } from '@repo/shadcn/button';
import { Badge } from '@repo/shadcn/badge';
import { cn } from '@repo/shadcn/lib/utils';
import { formatCurrency } from '@/lib/format-utils';
import { type SettlementPaymentApi } from '../schemas/settlement-api-response';
import { ESTATUS_TYPES } from '../schemas/settlement-options';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: SettlementPaymentApi | null;
}

export function SettlementDetailsModal({ open, onOpenChange, data }: Props) {
  if (!data) return null;

  const statusText =
    ESTATUS_TYPES[data.status as keyof typeof ESTATUS_TYPES] || data.status;
  const variant = (() => {
    switch (data.status) {
      case 'REQUESTED':
        return 'default';
      case 'PROCESSED':
        return 'warning';
      case 'DISBURSED':
        return 'success';
      case 'CANCELLED':
      case 'REJECTED':
        return 'destructive';
      default:
        return 'default';
    }
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" /> Detalles de Liquidación
          </DialogTitle>
          <DialogDescription>
            Detalles de la liquidación
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="rounded-lg border p-4 bg-muted/30">
            <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-3">
              Datos del Asociado
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Nombre y Apellido:
                </span>
                <span className="text-sm font-bold">
                  {data.associateFullname || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Cédula:
                </span>
                <span className="text-sm font-mono">
                  {data.associateCedula || '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4 bg-muted/30">
            <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-3">
              Detalles de la Liquidación
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Referencia:
                </span>
                <span className="text-sm font-mono">
                  {data.customReference || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Fecha:
                </span>
                <span className="text-sm">
                  {data.liquidationDate
                    ? new Date(data.liquidationDate).toLocaleDateString(
                      'es-VE',
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      },
                    )
                    : '—'}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Haberes:
                </span>
                <span className="text-sm font-mono font-bold">
                  {formatCurrency(
                    Number(data.totalSavingsBalanceAtLiquidation ?? 0),
                    'VES',
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Préstamos Pendientes:
                </span>
                <span className="text-sm font-mono text-red-600 dark:text-red-400">
                  -{formatCurrency(
                    Number(data.totalOutstandingLoansAtLiquidation ?? 0),
                    'VES',
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Créditos Pendientes:
                </span>
                <span className="text-sm font-mono text-red-600 dark:text-red-400">
                  -{formatCurrency(
                    Number(data.totalOutstandingCreditsAtLiquidation ?? 0),
                    'VES',
                  )}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Monto Liquidado:
                </span>
                <span className="text-sm font-mono font-bold text-[#2EA640]">
                  {formatCurrency(
                    Number(data.netLiquidationAmount ?? 0),
                    'VES',
                  )}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Estado:
                </span>
                <div className={cn('p-2 h-full w-full flex justify-end')}>
                  <Badge variant={variant as any}>{statusText}</Badge>
                </div>
              </div>
              {data.notes && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Notas:
                    </span>
                    <span className="text-sm">{data.notes}</span>
                  </div>
                </>
              )}
              {data.beneficiary && data.beneficiary.fullname && (
                <>
                  <Separator />
                  <h3 className="font-semibold text-sm uppercase text-muted-foreground mt-2 mb-2">
                    Datos del Beneficiario
                  </h3>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Nombre y Apellido:
                    </span>
                    <span className="text-sm font-bold">
                      {data.beneficiary.fullname}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Cédula:
                    </span>
                    <span className="text-sm font-mono">
                      {data.beneficiary.cedula || '—'}
                    </span>
                  </div>
                  {data.beneficiary.phone && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Teléfono:
                      </span>
                      <span className="text-sm">
                        {data.beneficiary.phone}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Nro. Cuenta:
                    </span>
                    <span className="text-sm font-mono">
                      {data.beneficiary.accountNumber || '—'}
                    </span>
                  </div>
                  {data.beneficiary.bankName && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Banco:
                      </span>
                      <span className="text-sm">
                        {data.beneficiary.bankName}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

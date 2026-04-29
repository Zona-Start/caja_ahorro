'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Button } from '@repo/shadcn/button';
import { Label } from '@repo/shadcn/label';
import { Badge } from '@repo/shadcn/badge';
import { LoanPaymentApi } from '../schemas/loans-paid-api-response';
import {
  LOAN_PAYMENT_TYPES,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
} from '../schemas/loans-paid-options';
import { Banknote, Calendar, ClipboardList, User } from 'lucide-react';

interface LoansPaidDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: LoanPaymentApi;
}

export function LoansPaidDetailModal({
  open,
  onOpenChange,
  data,
}: LoansPaidDetailModalProps) {
  const statusKey = data.paymentStatus as keyof typeof PAYMENT_STATUS;
  const typeKey = data.paymentType as keyof typeof LOAN_PAYMENT_TYPES;
  const methodKey = data.paymentMethod as keyof typeof PAYMENT_METHOD;

  let badgeVariant: 'default' | 'outline' | 'secondary' | 'destructive' | 'success' = 'default';
  if (data.paymentStatus === 'DONE') badgeVariant = 'success';
  if (data.paymentStatus === 'CANCELED') badgeVariant = 'destructive';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-500" />
            Detalle del Pago: {data.customReference}
          </DialogTitle>
          <DialogDescription>
            Vista de solo lectura del registro de pago procesado.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Información del Asociado */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2 border-b pb-1.5">
              <User className="h-4 w-4 text-muted-foreground" />
              Información del Asociado
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground text-xs">Cédula</Label>
                <div className="font-medium mt-1">{data.associateCedula}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Nombre Completo</Label>
                <div className="font-medium mt-1 uppercase">{data.associateFullname}</div>
              </div>
            </div>
          </div>

          {/* Detalles Técnicos */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2 border-b pb-1.5">
              <Banknote className="h-4 w-4 text-muted-foreground" />
              Detalles del Pago
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground text-xs">Monto</Label>
                <div className="font-semibold text-lg mt-1 text-primary">
                  {Number(data.amount).toLocaleString('es-VE', { style: 'currency', currency: 'VES' })}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Estatus</Label>
                <div className="mt-1">
                  <Badge variant={badgeVariant}>
                    {PAYMENT_STATUS[statusKey] || data.paymentStatus}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Tipo de Operación</Label>
                <div className="font-medium mt-1">{LOAN_PAYMENT_TYPES[typeKey] || data.paymentType}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Método de Pago</Label>
                <div className="font-medium mt-1">{PAYMENT_METHOD[methodKey] || data.paymentMethod}</div>
              </div>
            </div>
          </div>

          {/* Información de Transacción */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2 border-b pb-1.5">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Transacción Bancaria
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground text-xs">Fecha de Pago</Label>
                <div className="font-medium mt-1">{data.paymentDate}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Referencia Bancaria</Label>
                <div className="font-medium mt-1">{data.transactionReference || 'N/A'}</div>
              </div>
              <div className="col-span-2">
                <Label className="text-muted-foreground text-xs">Banco Receptor</Label>
                <div className="font-medium mt-1">{data.bankName || 'No especificado'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

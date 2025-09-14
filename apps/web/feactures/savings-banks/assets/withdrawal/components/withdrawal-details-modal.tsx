'use client';

import { Badge } from '@repo/shadcn/badge';
import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { WithdrawalPaymentApi } from '../schemas/withdrawal-api-response';
import { ESTATUS_TYPES } from '../schemas/withdrawal-options';

interface WithdrawalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  withdrawal: WithdrawalPaymentApi | null;
}

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode | string | number | null | undefined;
}) => (
  <div className="flex justify-between items-center py-2 border-b border-border/50">
    <p className="text-sm text-muted-foreground">{label}</p>
    <div className="text-sm font-medium text-right">{value || 'N/A'}</div>
  </div>
);

export function WithdrawalDetailsModal({
  isOpen,
  onClose,
  withdrawal,
}: WithdrawalDetailsModalProps) {
  if (!withdrawal) return null;

  const formatCurrency = (amount: number | string | null | undefined) => {
    const num = Number(amount);
    if (isNaN(num)) return 'N/A';
    return `${num.toFixed(2)} Bs.`;
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const statusLabel =
    ESTATUS_TYPES[withdrawal.status as keyof typeof ESTATUS_TYPES] ||
    withdrawal.status;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Retiro</DialogTitle>
          <DialogDescription>
            Referencia: {withdrawal.customReference || 'N/A'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Card>
            <CardHeader>
              <CardTitle>Información del Asociado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <DetailItem label="Nombre" value={withdrawal.associateFullname} />
              <DetailItem label="Cédula" value={withdrawal.associateCedula} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalles del Retiro</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-x-8 gap-y-1">
              <DetailItem
                label="Monto Solicitado"
                value={formatCurrency(withdrawal.requestedAmount)}
              />
              <DetailItem
                label="Tipo de Retiro"
                value={withdrawal.withdrawalType}
              />
              <DetailItem
                label="Estatus"
                value={<Badge>{statusLabel}</Badge>}
              />
              <DetailItem
                label="Fecha de Retiro"
                value={formatDate(withdrawal.withdrawalDate)}
              />
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

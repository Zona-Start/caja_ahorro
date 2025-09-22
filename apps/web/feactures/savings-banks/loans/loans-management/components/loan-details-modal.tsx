'use client';

import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import { Badge } from '@repo/shadcn/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Separator } from '@repo/shadcn/separator';

import { formatCurrency } from '@/lib/formatCurrent';
import {
  ESTATUS_TYPES,
  lOAN_MODALITY,
  PAYMENT_METHOD,
} from '../schemas/loans-management-options';
import { LoanManagement } from '../schemas/loans-management.schema';

interface LoanDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: LoanManagement | null;
}

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex justify-between items-center">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium text-right">{value}</span>
  </div>
);

export function LoanDetailsModal({
  isOpen,
  onClose,
  loan,
}: LoanDetailsModalProps) {
  if (!loan) {
    return null;
  }

  const status = loan.status;
  const statusText =
    ESTATUS_TYPES[status as keyof typeof ESTATUS_TYPES] || status;
  const statusVariant:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'success'
    | 'warning' = (() => {
    switch (status) {
      case 'REQUESTED':
        return 'default';
      case 'APPROVED':
        return 'secondary';
      case 'DISBURSED':
        return 'warning';
      case 'IN_PAYMENT':
        return 'outline';
      case 'PAID':
        return 'success';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'default';
    }
  })();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>
            Detalles del Préstamo - {loan.customReference}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Información del Asociado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <DetailItem label="Nombre" value={loan.associateFullname} />
                <DetailItem label="Cédula" value={loan.associateCedula} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Información del Préstamo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <DetailItem
                  label="Tipo de Préstamo"
                  value={loan.loanTypeName}
                />
                <DetailItem
                  label="Modalidad"
                  value={
                    lOAN_MODALITY[
                      loan.loanModality as keyof typeof lOAN_MODALITY
                    ] || loan.loanModality
                  }
                />
                <DetailItem
                  label="Monto Solicitado"
                  value={formatCurrency(Number(loan.requestedAmount), 'VES')}
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Estatus</span>
                  <Badge variant={statusVariant as any}>{statusText}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Condiciones Financieras</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
              <DetailItem
                label="Monto Aprobado"
                value={formatCurrency(Number(loan.requestedAmount), 'VES')}
              />
              <DetailItem
                label="Monto a Desembolsar"
                value={formatCurrency(Number(loan.disbursedAmount), 'VES')}
              />
              <DetailItem
                label="Interés Total"
                value={formatCurrency(Number(loan.totalInterest), 'VES')}
              />
              <DetailItem
                label="Gastos Administrativos"
                value={formatCurrency(Number(loan.expensesAmount), 'VES')}
              />
              <Separator className="my-2 md:col-span-2" />
              <DetailItem
                label="Total a Pagar"
                value={formatCurrency(Number(loan.totalPayable), 'VES')}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Plazos y Fechas</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
              <DetailItem
                label="Fecha de Solicitud"
                value={new Date(loan.requestDate!).toLocaleDateString()}
              />
              <DetailItem
                label="Fecha de Aprobación"
                value={
                  loan.approvalDate
                    ? new Date(loan.approvalDate).toLocaleDateString()
                    : 'N/A'
                }
              />
              <DetailItem
                label="Fecha de Inicio"
                value={new Date(loan.startDate!).toLocaleDateString()}
              />
              <DetailItem
                label="Fecha de Culminación"
                value={new Date(loan.endDate!).toLocaleDateString()}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Información Adicional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <DetailItem
                label="Método de Pago"
                value={
                  PAYMENT_METHOD[
                    loan.paymentMethod as keyof typeof PAYMENT_METHOD
                  ] || loan.paymentMethod
                }
              />
              <DetailItem label="Notas" value={loan.notes || 'N/A'} />
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

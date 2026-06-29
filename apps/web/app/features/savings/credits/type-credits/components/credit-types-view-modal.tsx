import { Badge } from '@repo/shadcn/badge';
import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader } from '@repo/shadcn/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/shadcn/dialog';
import { FileText, Percent, Calculator, ToggleLeft, Clock } from 'lucide-react';
import { useCategoriesByTypeQuery } from '@/features/core/categories/hooks/use-categories-queries';
import type { CreditType } from '../schemas/credit-types.schema';

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function BoolBadge({ value }: { value?: boolean | null }) {
  return <Badge variant={value ? 'default' : 'secondary'}>{value ? 'Sí' : 'No'}</Badge>;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creditType?: CreditType | null;
}

export function CreditTypesViewModal({ open, onOpenChange, creditType }: Props) {
  const { data: payrollTypes } = useCategoriesByTypeQuery('payroll_type');

  if (!creditType) return null;

  const payrollName = payrollTypes?.find((c) => c.id === creditType.payrollTypeId)?.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Tipo de Crédito</DialogTitle>
          <DialogDescription>Información completa del tipo de crédito.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
              <FileText className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-semibold">Información General</h3>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoRow label="Nombre" value={creditType.name} />
                <InfoRow label="Descripción" value={creditType.description || '—'} />
                <InfoRow label="Tipo de Plazo" value={creditType.termType} />
                <InfoRow label="N° Cuotas / Plazos" value={creditType.termUnits} />
                <InfoRow label="Tipo de Nómina" value={payrollName || creditType.payrollTypeId || '—'} />

              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
              <Percent className="h-5 w-5 text-purple-600" />
              <h3 className="text-sm font-semibold">Parámetros Financieros</h3>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoRow label="Tasa de Interés" value={`${creditType.interestRate}%`} />
                <InfoRow label="% Cancelación" value={creditType.cancellationPercentage != null ? `${creditType.cancellationPercentage}%` : '—'} />
                <InfoRow label="% Gasto Administrativo" value={creditType.administrativeExpensePercentage != null ? `${creditType.administrativeExpensePercentage}%` : '—'} />
                <InfoRow label="Antigüedad Mínima" value={creditType.minimumSeniorityMonths != null ? `${creditType.minimumSeniorityMonths} meses` : '—'} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
              <Calculator className="h-5 w-5 text-green-600" />
              <h3 className="text-sm font-semibold">Montos y Cuotas Especiales</h3>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoRow label="Monto Mínimo" value={creditType.minCreditAmount != null ? `Bs. ${creditType.minCreditAmount}` : '—'} />
                <InfoRow label="Monto Máximo" value={creditType.maxCreditAmount != null ? `Bs. ${creditType.maxCreditAmount}` : '—'} />
                <InfoRow label="N° Cuota Especial" value={creditType.specialQuotaNumber || '—'} />
                <InfoRow label="% Cuota Especial" value={creditType.specialQuotaPercentage != null ? `${creditType.specialQuotaPercentage}%` : '—'} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
              <ToggleLeft className="h-5 w-5 text-amber-600" />
              <h3 className="text-sm font-semibold">Configuración</h3>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-2 gap-3">
                <InfoRow label="Acepta Saldo Deudor" value={<BoolBadge value={creditType.acceptsDebitBalance} />} />
                <InfoRow label="Acepta Fiadores" value={<BoolBadge value={creditType.acceptsGuarantors} />} />
                <InfoRow label="Afecta Disponibilidad" value={<BoolBadge value={creditType.acceptsAvailability} />} />
                <InfoRow label="Acepta Refinanciamiento" value={<BoolBadge value={creditType.acceptsRefinancing} />} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
              <Clock className="h-5 w-5 text-gray-500" />
              <h3 className="text-sm font-semibold">Registro</h3>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoRow label="Creado" value={creditType.createdAt ? new Date(creditType.createdAt).toLocaleDateString('es-VE') : '—'} />
                <InfoRow label="Actualizado" value={creditType.updatedAt ? new Date(creditType.updatedAt).toLocaleDateString('es-VE') : '—'} />
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

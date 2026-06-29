import { Badge } from '@repo/shadcn/badge';
import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader } from '@repo/shadcn/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/shadcn/dialog';
import { useQuery } from '@tanstack/react-query';
import { FileText, Percent, Calculator, ToggleLeft, Clock } from 'lucide-react';
import { useLoanTypeQuery } from '../hooks/use-type-loans-query';
import { useCategoriesByTypeQuery } from '@/features/core/categories/hooks/use-categories-queries';
import type { LoanType } from '../schemas/loan-types.schema';

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function BoolBadge({ value, yes = 'Sí', no = 'No' }: { value?: boolean | null; yes?: string; no?: string }) {
  return <Badge variant={value ? 'default' : 'secondary'}>{value ? yes : no}</Badge>;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanType?: LoanType | null;
}

export function LoanTypesViewModal({ open, onOpenChange, loanType }: Props) {
  const { data: payrollTypes } = useCategoriesByTypeQuery('payroll_type');

  if (!loanType) return null;

  const payrollName = payrollTypes?.find((c) => c.id === loanType.payrollTypeId)?.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Tipo de Préstamo</DialogTitle>
          <DialogDescription>Información completa del tipo de préstamo.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información General */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
              <FileText className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-semibold">Información General</h3>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoRow label="Nombre" value={loanType.name} />
                <InfoRow label="Descripción" value={loanType.description || '—'} />
                <InfoRow label="Tipo de Plazo" value={loanType.termType} />
                <InfoRow label="N° Cuotas / Plazos" value={loanType.termUnits} />
                <InfoRow label="Tipo de Nómina" value={payrollName || loanType.payrollTypeId || '—'} />
              </div>
            </CardContent>
          </Card>

          {/* Parámetros Financieros */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
              <Percent className="h-5 w-5 text-purple-600" />
              <h3 className="text-sm font-semibold">Parámetros Financieros</h3>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoRow label="Tasa de Interés" value={`${loanType.interestRate}%`} />
                <InfoRow label="% Cancelación" value={loanType.cancellationPercentage != null ? `${loanType.cancellationPercentage}%` : '—'} />
                <InfoRow label="% Gasto Administrativo" value={loanType.administrativeExpensePercentage != null ? `${loanType.administrativeExpensePercentage}%` : '—'} />
                <InfoRow label="Antigüedad Mínima" value={loanType.minimumSeniorityMonths != null ? `${loanType.minimumSeniorityMonths} meses` : '—'} />
              </div>
            </CardContent>
          </Card>

          {/* Montos y Cuotas */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
              <Calculator className="h-5 w-5 text-green-600" />
              <h3 className="text-sm font-semibold">Montos y Cuotas Especiales</h3>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoRow label="Monto Mínimo" value={loanType.minLoanAmount != null ? `Bs. ${loanType.minLoanAmount}` : '—'} />
                <InfoRow label="Monto Máximo" value={loanType.maxLoanAmount != null ? `Bs. ${loanType.maxLoanAmount}` : '—'} />
                <InfoRow label="N° Cuota Especial" value={loanType.specialQuotaNumber || '—'} />
                <InfoRow label="% Cuota Especial" value={loanType.specialQuotaPercentage != null ? `${loanType.specialQuotaPercentage}%` : '—'} />
              </div>
            </CardContent>
          </Card>

          {/* Configuración */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
              <ToggleLeft className="h-5 w-5 text-amber-600" />
              <h3 className="text-sm font-semibold">Configuración</h3>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-2 gap-3">
                <InfoRow label="Acepta Saldo Deudor" value={<BoolBadge value={loanType.acceptsDebitBalance} />} />
                <InfoRow label="Acepta Fiadores" value={<BoolBadge value={loanType.acceptsGuarantors} />} />
                <InfoRow label="Afecta Disponibilidad" value={<BoolBadge value={loanType.acceptsAvailability} />} />
                <InfoRow label="Acepta Refinanciamiento" value={<BoolBadge value={loanType.acceptsRefinancing} />} />
              </div>
            </CardContent>
          </Card>

          {/* Registro */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
              <Clock className="h-5 w-5 text-gray-500" />
              <h3 className="text-sm font-semibold">Registro</h3>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoRow label="Creado" value={loanType.createdAt ? new Date(loanType.createdAt).toLocaleDateString('es-VE') : '—'} />
                <InfoRow label="Actualizado" value={loanType.updatedAt ? new Date(loanType.updatedAt).toLocaleDateString('es-VE') : '—'} />
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

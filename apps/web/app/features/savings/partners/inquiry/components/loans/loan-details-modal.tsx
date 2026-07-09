import { formatCurrency } from '@/lib/format-utils';
import { Badge } from '@repo/shadcn/badge';
import { Button } from '@repo/shadcn/button';
import { Separator } from '@repo/shadcn/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/shadcn/table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useLoanDetailsQuery } from '../../hooks/use-inquiry-query';
import {
  LOAN_STATUS_TYPES,
  PAYMENT_LOAN_STATUS,
} from '../../schemas/inquiry-options';

interface LoanDetailsModalProps {
  loanId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoanDetailsModal({
  loanId,
  open,
  onOpenChange,
}: LoanDetailsModalProps) {
  const { data, isLoading, isError } = useLoanDetailsQuery(loanId);

  const status = data?.loan.status;
  const statusText =
    LOAN_STATUS_TYPES[status as keyof typeof LOAN_STATUS_TYPES] || status;

  const variant = (() => {
    switch (status) {
      case 'REQUESTED':
        return 'default' as const;
      case 'APPROVED':
        return 'outline' as const;
      case 'DISBURSED':
        return 'warning' as const;
      case 'IN_PAYMENT':
        return 'secondary' as const;
      case 'PAID':
        return 'success' as const;
      case 'CANCELLED':
      case 'REJECTED':
        return 'destructive' as const;
      default:
        return 'default' as const;
    }
  })();

  const paymentVariant = (ps: keyof typeof PAYMENT_LOAN_STATUS) => {
    switch (ps) {
      case 'PAID':
        return 'success' as const;
      case 'PARTIAL':
        return 'warning' as const;
      case 'OVERDUE':
        return 'destructive' as const;
      default:
        return 'default' as const;
    }
  };

  const formatDate = (d: string | null | undefined) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('es-VE');
  };

  const termLabel = data?.loan?.termType === 'INSTALLMENTS' ? 'Cuotas' : 'Plazo';
  const plazoDisplay =
    data?.loan.termUnits != null && data?.loan.termType
      ? `${data.loan.termUnits}`
      : 'N/A';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Préstamo</DialogTitle>
          <DialogDescription>
            Información completa del préstamo y su plan de amortización.
          </DialogDescription>
        </DialogHeader>

        {isLoading && <DataTableSkeleton columnCount={5} />}

        {isError && (
          <div className="py-6 text-center text-destructive">
            Error al cargar los detalles del préstamo.
          </div>
        )}

        {data && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Referencia
                </p>
                <p className="font-mono font-semibold">
                  {data.loan.customReference || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Tipo
                </p>
                <p>{data.loan.loanTypeName}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Estado
                </p>
                <Badge variant={variant as any}>{statusText}</Badge>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Fecha Solicitud
                </p>
                <p>{formatDate(data.loan.requestDate)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Tasa Anual
                </p>
                <p className="font-semibold">
                  {data.loan.interestRate ? `${data.loan.interestRate}%` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  {termLabel}
                </p>
                <p>{plazoDisplay}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  F. Inicio
                </p>
                <p>{formatDate(data.loan.startDate)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  F. Fin
                </p>
                <p>{formatDate(data.loan.endDate)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Cuotas Pendientes
                </p>
                <p className="font-bold text-amber-600">
                  {data.summary.pendingInstallments}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Cuotas Pagadas
                </p>
                <p className="font-bold text-emerald-600">
                  {data.summary.paidInstallments}
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Monto Solicitado</p>
                <p className="text-lg font-bold font-mono">
                  {formatCurrency(Number(data.loan.requestedAmount), 'VES')}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Cuota</p>
                <p className="text-lg font-bold font-mono">
                  {formatCurrency(Number(data.loan.installmentAmount || 0), 'VES')}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Gasto Admin.</p>
                <p className="text-lg font-bold font-mono">
                  {formatCurrency(Number(data.loan.expensesAmount || 0), 'VES')}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Interés Total</p>
                <p className="text-lg font-bold font-mono text-amber-600">
                  {formatCurrency(Number(data.loan.totalInterest || 0), 'VES')}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Total a Pagar</p>
                <p className="text-lg font-bold font-mono text-amber-600">
                  {formatCurrency(Number(data.loan.totalPayable || 0), 'VES')}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Total Pagado</p>
                <p className="text-lg font-bold font-mono text-emerald-600">
                  {formatCurrency(data.summary.totalPaid, 'VES')}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Pendiente</p>
                <p className="text-lg font-bold font-mono text-red-500">
                  {formatCurrency(data.summary.totalPending, 'VES')}
                </p>
              </div>
            </div>

            {data.amortizationSchedule.length > 0 && (
              <div className="rounded-lg border">
                <div className="bg-muted px-4 py-2 font-semibold text-sm">
                  Plan de Amortización
                </div>
                <div className="overflow-auto max-h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Vencimiento</TableHead>
                        <TableHead className="text-right">Cuota</TableHead>
                        <TableHead className="text-right">Capital</TableHead>
                        <TableHead className="text-right">Interés</TableHead>
                        <TableHead className="text-right">Pagado</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.amortizationSchedule.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-xs">
                            {item.installmentNumber}
                          </TableCell>
                          <TableCell>
                            {formatDate(item.dueDate)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {formatCurrency(Number(item.totalInstallmentAmount), 'VES')}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {formatCurrency(Number(item.principalAmount), 'VES')}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {formatCurrency(Number(item.interestAmount), 'VES')}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {formatCurrency(Number(item.paidAmount || 0), 'VES')}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                paymentVariant(
                                  item.paymentStatus as keyof typeof PAYMENT_LOAN_STATUS,
                                ) as any
                              }
                              className="text-xs"
                            >
                              {PAYMENT_LOAN_STATUS[
                                item.paymentStatus as keyof typeof PAYMENT_LOAN_STATUS
                              ] ?? item.paymentStatus}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

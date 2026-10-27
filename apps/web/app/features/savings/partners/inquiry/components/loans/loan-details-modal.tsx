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

  const loanCurrency =
    data?.loan.currencyCode &&
    data.loan.currencyCode !== 'VES' &&
    Number(data.loan.exchangeRate ?? 0) > 0
      ? data.loan.currencyCode
      : 'VES';
  const loanRate =
    Number(data?.loan.exchangeRate ?? 0) > 0
      ? Number(data?.loan.exchangeRate)
      : 1;
  const currentRate =
    Number(data?.loan.currentExchangeRate ?? 0) > 0
      ? Number(data?.loan.currentExchangeRate)
      : loanRate;
  const isForeign = loanCurrency !== 'VES';
  const money = (value: number) => formatCurrency(value, loanCurrency);
  const bsLine = (value: number) =>
    isForeign ? (
      <div className="text-[11px] text-muted-foreground">
        ≈ {formatCurrency(value * loanRate, 'VES')} (tasa de creación)
      </div>
    ) : null;
  const bsCurrentLine = (value: number) =>
    isForeign ? (
      <div className="text-[11px] text-muted-foreground">
        ≈ {formatCurrency(value * currentRate, 'VES')} (tasa del día)
      </div>
    ) : null;

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
                  Moneda
                </p>
                <p className="font-semibold">
                  {loanCurrency === 'VES'
                    ? 'Bolívares (VES)'
                    : loanCurrency === 'USD'
                      ? 'Dólares (USD)'
                      : loanCurrency === 'EUR'
                        ? 'Euros (EUR)'
                        : loanCurrency}
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
                  {money(Number(data.loan.requestedAmount))}
                </p>
                {bsLine(Number(data.loan.requestedAmount))}
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Cuota</p>
                <p className="text-lg font-bold font-mono">
                  {money(Number(data.loan.installmentAmount || 0))}
                </p>
                {bsCurrentLine(Number(data.loan.installmentAmount || 0))}
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Gasto Admin.</p>
                <p className="text-lg font-bold font-mono">
                  {money(Number(data.loan.expensesAmount || 0))}
                </p>
                {bsLine(Number(data.loan.expensesAmount || 0))}
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Interés Total</p>
                <p className="text-lg font-bold font-mono text-amber-600">
                  {money(Number(data.loan.totalInterest || 0))}
                </p>
                {bsLine(Number(data.loan.totalInterest || 0))}
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Total a Pagar</p>
                <p className="text-lg font-bold font-mono text-amber-600">
                  {money(Number(data.loan.totalPayable || 0))}
                </p>
                {bsLine(Number(data.loan.totalPayable || 0))}
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Total Pagado</p>
                <p className="text-lg font-bold font-mono text-emerald-600">
                  {money(data.summary.totalPaid)}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Pendiente</p>
                <p className="text-lg font-bold font-mono text-red-500">
                  {money(data.summary.totalPending)}
                </p>
                {bsCurrentLine(data.summary.totalPending)}
              </div>
            </div>

            {data.amortizationSchedule.length > 0 && (
              <div className="rounded-lg border">
                <div className="bg-muted px-4 py-2 font-semibold text-sm">
                  Plan de Amortización ({loanCurrency})
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
                            {money(Number(item.totalInstallmentAmount))}
                            {isForeign &&
                              (item.paymentStatus === 'PENDING' ||
                                item.paymentStatus === 'PARTIAL') && (
                                <div className="text-[10px] font-normal text-muted-foreground">
                                  ≈{' '}
                                  {formatCurrency(
                                    Number(item.totalInstallmentAmount) *
                                      currentRate,
                                    'VES',
                                  )}{' '}
                                  (tasa del día)
                                </div>
                              )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {money(Number(item.principalAmount))}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {money(Number(item.interestAmount))}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {money(Number(item.paidAmount || 0))}
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

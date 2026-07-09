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
import { useCreditDetailsQuery } from '../../hooks/use-inquiry-query';
import {
  CREDIT_SATUS,
  PAYMENT_LOAN_STATUS,
} from '../../schemas/inquiry-options';

interface CreditDetailsModalProps {
  creditId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreditDetailsModal({
  creditId,
  open,
  onOpenChange,
}: CreditDetailsModalProps) {
  const { data, isLoading, isError } = useCreditDetailsQuery(creditId);

  const status = data?.credit.status;
  const statusText =
    CREDIT_SATUS[status as keyof typeof CREDIT_SATUS] || status;

  const variant = (() => {
    switch (status) {
      case 'REQUESTED':
        return 'default' as const;
      case 'APPROVED':
        return 'outline' as const;
      case 'IN_PAYMENT':
        return 'warning' as const;
      case 'PAID':
        return 'success' as const;
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

  const termLabel = data?.credit?.termType === 'INSTALLMENTS' ? 'Cuotas' : 'Plazo';
  const plazoDisplay =
    data?.credit.termUnits != null && data?.credit.termType
      ? `${data.credit.termUnits}`
      : 'N/A';

  const requestedAmount = Number(data?.credit.requestedAmount || 0);
  const haberesPayment = Number(data?.credit.haberesPayment || 0);
  const directPayment = Number(data?.credit.directPayment || 0);
  const financedAmount = Math.max(0, requestedAmount - haberesPayment - directPayment);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Crédito</DialogTitle>
          <DialogDescription>
            Información completa del crédito y su plan de amortización.
          </DialogDescription>
        </DialogHeader>

        {isLoading && <DataTableSkeleton columnCount={5} />}

        {isError && (
          <div className="py-6 text-center text-destructive">
            Error al cargar los detalles del crédito.
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
                  {data.credit.customReference || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Tipo
                </p>
                <p>{data.credit.creditTypeName}</p>
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
                <p>{formatDate(data.credit.requestDate)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Tasa Anual
                </p>
                <p className="font-semibold">
                  {data.credit.interestRate
                    ? `${data.credit.interestRate}%`
                    : 'N/A'}
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
                <p>{formatDate(data.credit.startDate)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  F. Fin
                </p>
                <p>{formatDate(data.credit.endDate)}</p>
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

            <div>
              <p className="text-sm font-semibold mb-3">Desglose del Crédito</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg border p-3 bg-blue-50 dark:bg-blue-950">
                  <p className="text-xs text-muted-foreground">Monto Solicitado</p>
                  <p className="text-lg font-bold font-mono text-blue-700 dark:text-blue-300">
                    {formatCurrency(requestedAmount, 'VES')}
                  </p>
                </div>
                <div className="rounded-lg border p-3 bg-violet-50 dark:bg-violet-950">
                  <p className="text-xs text-muted-foreground">Pago con Haberes</p>
                  <p className="text-lg font-bold font-mono text-violet-700 dark:text-violet-300">
                    {formatCurrency(haberesPayment, 'VES')}
                  </p>
                </div>
                <div className="rounded-lg border p-3 bg-amber-50 dark:bg-amber-950">
                  <p className="text-xs text-muted-foreground">Pago Directo Inicial</p>
                  <p className="text-lg font-bold font-mono text-amber-700 dark:text-amber-300">
                    {formatCurrency(directPayment, 'VES')}
                  </p>
                </div>
                <div className="rounded-lg border p-3 bg-emerald-50 dark:bg-emerald-950">
                  <p className="text-xs text-muted-foreground">Total Financiado</p>
                  <p className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(financedAmount, 'VES')}
                  </p>
                </div>
              </div>
              {data.credit.directPaymentMethod && (
                <p className="text-xs text-muted-foreground mt-2">
                  Método de pago directo: {data.credit.directPaymentMethod}
                  {data.credit.directPaymentReference &&
                    ` — Ref: ${data.credit.directPaymentReference}`}
                </p>
              )}
            </div>

            <Separator />

            <div>
              <p className="text-sm font-semibold mb-3">Resumen Financiero</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Cuota</p>
                  <p className="text-lg font-bold font-mono">
                    {formatCurrency(Number(data.credit.installmentAmount || 0), 'VES')}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Gasto Admin.</p>
                  <p className="text-lg font-bold font-mono">
                    {formatCurrency(Number(data.credit.expensesAmount || 0), 'VES')}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Interés Total</p>
                  <p className="text-lg font-bold font-mono text-amber-600">
                    {formatCurrency(Number(data.credit.totalInterest || 0), 'VES')}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Total a Pagar</p>
                  <p className="text-lg font-bold font-mono text-amber-600">
                    {formatCurrency(Number(data.credit.totalPayable || 0), 'VES')}
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
            </div>

            {data.items && data.items.length > 0 && (
              <div className="rounded-lg border">
                <div className="bg-muted px-4 py-2 font-semibold text-sm">
                  Ítems / Productos del Crédito
                </div>
                <div className="overflow-auto max-h-[250px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item / Producto</TableHead>
                        <TableHead className="w-16 text-center">Cant.</TableHead>
                        <TableHead className="text-right">Precio</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.items.map((item, idx) => {
                        const qty = Number(item.quantity || 1);
                        const price = Number(item.agreedSellingPrice || 0);
                        const subtotal = qty * price;
                        const displayName =
                          item.productName ||
                          item.itemDescription ||
                          item.itemType ||
                          `Ítem #${idx + 1}`;
                        return (
                          <TableRow key={item.id || idx}>
                            <TableCell>
                              <p className="font-medium">{displayName}</p>
                              {item.productName && item.itemDescription && (
                                <p className="text-xs text-muted-foreground">
                                  {item.itemDescription}
                                </p>
                              )}
                              {item.itemType && !item.productName && (
                                <p className="text-xs text-muted-foreground">
                                  {item.itemType === 'EXTERNAL'
                                    ? 'Externo'
                                    : item.itemType === 'SERVICE'
                                    ? 'Servicio'
                                    : item.itemType}
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="text-center">{qty}</TableCell>
                            <TableCell className="text-right font-mono text-xs">
                              {formatCurrency(price, 'VES')}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs font-semibold">
                              {formatCurrency(subtotal, 'VES')}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

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
                          <TableCell>{formatDate(item.dueDate)}</TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {formatCurrency(
                              Number(item.totalInstallmentAmount),
                              'VES',
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {formatCurrency(
                              Number(item.principalAmount),
                              'VES',
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {formatCurrency(
                              Number(item.interestAmount),
                              'VES',
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {formatCurrency(
                              Number(item.paidAmount || 0),
                              'VES',
                            )}
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

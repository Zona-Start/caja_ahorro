import { formatCurrency } from '@/lib/format-utils';
import { useAuthStore } from '@/stores/auth.store';
import { Badge } from '@repo/shadcn/badge';
import { Button } from '@repo/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Separator } from '@repo/shadcn/separator';
import { Textarea } from '@repo/shadcn/textarea';
import {
  CalendarClock,
  CheckCircle2,
  FileText,
  HandCoins,
  Loader2,
  ScrollText,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import {
  useApproveExpenseMutation,
  useExpenseQuery,
  usePayExpenseMutation,
  useRejectExpenseMutation,
} from '../hooks/use-expense-queries';
import {
  EXPENSE_FREQUENCY_OPTIONS,
  EXPENSE_NATURE_OPTIONS,
  EXPENSE_STATUS_OPTIONS,
  EXPENSE_TYPE_OPTIONS,
  PAYMENT_SOURCE_OPTIONS,
} from '../schemas/expenses.schema';

interface ExpenseDetailsModalProps {
  expenseId: string | null;
  onOpenChange: (open: boolean) => void;
}

const toFixed2 = (value: number) =>
  value.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('es-VE');
};

export function ExpenseDetailsModal({
  expenseId,
  onOpenChange,
}: ExpenseDetailsModalProps) {
  const open = !!expenseId;
  const { data, isLoading } = useExpenseQuery(expenseId ?? '', open);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const approveMutation = useApproveExpenseMutation();
  const payMutation = usePayExpenseMutation();
  const rejectMutation = useRejectExpenseMutation();

  const [openReject, setOpenReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const expense = data?.data;
  const status = expense?.status ?? 'PENDING_APPROVAL';
  const canApprove = hasPermission('treasury:expenses', 'approve');
  const dueReached =
    !expense?.dueDate || new Date(expense.dueDate).getTime() <= Date.now();
  const canPay = status === 'APPROVED' && canApprove && dueReached;

  const amount = Number(expense?.amountBase ?? expense?.amount ?? 0);
  const converAmount = amount / Number(expense?.exchangeRate ?? 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            Detalle del Gasto
          </DialogTitle>
          <DialogDescription>
            Revisa el desglose y el estado antes de aprobar o pagar.
          </DialogDescription>
        </DialogHeader>

        {isLoading || !expense ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
          </div>
        ) : (
          <div className="space-y-4">
            {/* Estado y naturaleza */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  status === 'PAID'
                    ? 'secondary'
                    : status === 'REJECTED'
                      ? 'destructive'
                      : status === 'APPROVED'
                        ? 'success'
                        : 'warning'
                }
              >
                {EXPENSE_STATUS_OPTIONS[
                  status as keyof typeof EXPENSE_STATUS_OPTIONS
                ] ?? status}
              </Badge>
              <Badge
                variant={expense.nature === 'FIXED' ? 'warning' : 'outline'}
              >
                {EXPENSE_NATURE_OPTIONS[
                  expense.nature as keyof typeof EXPENSE_NATURE_OPTIONS
                ] ?? expense.nature}
              </Badge>
              <Badge variant="outline">
                {EXPENSE_TYPE_OPTIONS[
                  expense.type as keyof typeof EXPENSE_TYPE_OPTIONS
                ] ?? expense.type}
              </Badge>
            </div>

            {/* Datos generales */}
            <div className="rounded-lg border p-3 space-y-2 text-sm">
              <Row label="Descripción" value={expense.description} />
              {expense.supplierName && (
                <Row label="Proveedor" value={expense.supplierName} />
              )}
              <Row
                label="Fuente del dinero"
                value={
                  PAYMENT_SOURCE_OPTIONS[
                    expense.paymentSource as keyof typeof PAYMENT_SOURCE_OPTIONS
                  ] ?? expense.paymentSource
                }
              />
              <Row label="Moneda" value={expense.currencyCode} />
              <Row
                label="Tasa de cambio"
                value={String(expense.exchangeRate)}
              />
              <Row
                label="Base imponible IVA"
                value={toFixed2(Number(expense.taxAmountBase ?? 0))}
              />
              <Row
                label="Retención IVA"
                value={toFixed2(Number(expense.vatWithholdingAmount ?? 0))}
              />
              <Row
                label="Retención ISLR"
                value={toFixed2(Number(expense.islrWithholdingAmount ?? 0))}
              />
              <Row
                label="N° comprobante"
                value={expense.receiptNumber || '—'}
              />
            </div>

            {/* Programación fija */}
            {expense.nature === 'FIXED' && (
              <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-3 text-sm space-y-2">
                <div className="flex items-center gap-2 text-orange-600">
                  <CalendarClock className="h-4 w-4" />
                  <span className="font-semibold">Programación</span>
                </div>
                <Row
                  label="Fecha de pago"
                  value={formatDate(expense.dueDate)}
                />
                <Row
                  label="Frecuencia"
                  value={
                    expense.frequency
                      ? (EXPENSE_FREQUENCY_OPTIONS[
                          expense.frequency as keyof typeof EXPENSE_FREQUENCY_OPTIONS
                        ] ?? expense.frequency)
                      : '—'
                  }
                />
                <Row
                  label="Próximo pago"
                  value={formatDate(expense.nextDueDate)}
                />
                {!dueReached && (
                  <p className="text-xs text-muted-foreground">
                    El pago se habilitará al alcanzar la fecha programada.
                  </p>
                )}
              </div>
            )}

            {/* Líneas de detalle */}
            {expense.details && expense.details.length > 0 && (
              <div className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-semibold uppercase text-muted-foreground">
                    Líneas de detalle ({expense.details.length})
                  </span>
                </div>
                <div className="space-y-1">
                  {expense.details.map((line) => (
                    <div
                      key={line.id ?? line.categoryId}
                      className="flex items-center justify-between gap-2 text-xs border-b last:border-0 py-1"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="block font-medium truncate">
                          {line.categoryName || 'Sin categoría'}
                        </span>
                        <span className="block text-muted-foreground truncate">
                          {line.description}
                        </span>
                      </div>
                      <Badge variant={line.isExempt ? 'outline' : 'secondary'}>
                        {line.isExempt ? 'Exento' : `IVA ${line.taxRate}%`}
                      </Badge>
                      <span className="font-mono w-24 text-right">
                        {toFixed2(Number(line.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trazabilidad */}
            <div className="rounded-lg border p-3 space-y-2 text-sm">
              <Row label="Creado" value={formatDate(expense.createdAt)} />
              <Row label="Aprobado" value={formatDate(expense.approvedAt)} />
              <Row label="Pagado" value={formatDate(expense.paidAt)} />
              {status === 'REJECTED' && (
                <Row
                  label="Motivo de rechazo"
                  value={expense.rejectionReason || '—'}
                />
              )}
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              {expense.currencyCode !== 'VES' && (
                <div>
                  <span className="text-xs text-muted-foreground">
                    Total Divisa
                  </span>
                  <p className="text-xl font-black text-primary">
                    {expense.currencyCode} {converAmount}
                  </p>
                </div>
              )}
              <div>
                <span className="text-xs text-muted-foreground">
                  {expense.currencyCode !== 'VES'
                    ? 'Total en Bolívares (Tasa BCV)'
                    : 'Total'}
                </span>
                <p className="text-xl font-black text-primary">
                  {formatCurrency(amount, 'VES')}
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                {status === 'PENDING_APPROVAL' && canApprove && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setOpenReject(true)}
                    >
                      <XCircle className="mr-1 h-4 w-4" /> Rechazar
                    </Button>
                    <Button
                      size="sm"
                      disabled={approveMutation.isPending}
                      onClick={() =>
                        approveMutation.mutate(expense.id, {
                          onSuccess: () => onOpenChange(false),
                        })
                      }
                    >
                      <CheckCircle2 className="mr-1 h-4 w-4" /> Aprobar
                    </Button>
                  </>
                )}
                {canPay && (
                  <Button
                    size="sm"
                    disabled={payMutation.isPending}
                    onClick={() =>
                      payMutation.mutate(expense.id, {
                        onSuccess: () => onOpenChange(false),
                      })
                    }
                  >
                    <HandCoins className="mr-1 h-4 w-4" /> Registrar Pago
                  </Button>
                )}
                {status === 'APPROVED' && !dueReached && (
                  <span className="text-xs text-muted-foreground">
                    Pago disponible desde {formatDate(expense.dueDate)}.
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {openReject && expense && (
          <Dialog open onOpenChange={() => setOpenReject(false)}>
            <DialogContent className="sm:max-w-[420px]">
              <DialogHeader>
                <DialogTitle>Rechazar Gasto</DialogTitle>
                <DialogDescription>
                  El motivo quedará registrado para el solicitante.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                placeholder="Motivo del rechazo (opcional)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenReject(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={rejectMutation.isPending}
                  onClick={() =>
                    rejectMutation.mutate(
                      { id: expense.id, reason: rejectReason || undefined },
                      {
                        onSuccess: () => {
                          setOpenReject(false);
                          setRejectReason('');
                          onOpenChange(false);
                        },
                      },
                    )
                  }
                >
                  {rejectMutation.isPending ? 'Rechazando...' : 'Confirmar'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right truncate max-w-[320px]">{value}</span>
    </div>
  );
}

'use client';

import { formatCurrency } from '@/lib/format-utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/card';
import { Badge } from '@repo/shadcn/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/shadcn/table';
import { CreditCard } from 'lucide-react';
import { useLoansPaidStore } from '../store/loans-paid-store';
import { PAYMENT_STATUS } from '../schemas/loans-paid-options';

interface LoanPaidSummaryProps {
  currentCurrencyCode?: string;
}

export function LoanPaidSummary({
  currentCurrencyCode = 'VES',
}: LoanPaidSummaryProps) {
  const { selectedAssociate, loanSummary } = useLoansPaidStore();

  if (!selectedAssociate || !loanSummary) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumen del Préstamo</CardTitle>
            <CardDescription>
              Seleccione un asociado para ver el detalle del préstamo
            </CardDescription>
          </CardHeader>
          <CardContent className="flex h-56 items-center justify-center text-center">
            <div className="space-y-2">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                La información del préstamo se mostrará aquí
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Plan de Amortización
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-32 items-center justify-center text-center">
              <div className="space-y-2">
                <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Las cuotas del préstamo se mostrarán aquí
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingBalance = Number(loanSummary.pendingBalance);
  const totalAmount = Number(loanSummary.totalAmount);
  const progressPercentage =
    totalAmount > 0
      ? ((totalAmount - pendingBalance) / totalAmount) * 100
      : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Resumen del Préstamo</CardTitle>
            <Badge variant={pendingBalance <= 0 ? 'success' : 'warning'}>
              {pendingBalance <= 0 ? 'Pagado' : 'Pendiente'}
            </Badge>
          </div>
          <CardDescription>
            {loanSummary.loanReference} - {selectedAssociate.associate.fullname}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Monto Total</span>
              <span className="font-medium">
                {formatCurrency(totalAmount, currentCurrencyCode as 'VES' | 'USD')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Saldo Pendiente</span>
              <span className="font-bold text-lg text-red-600">
                {formatCurrency(pendingBalance, currentCurrencyCode as 'VES' | 'USD')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Cuotas Pagadas</span>
              <span className="font-medium">
                {loanSummary.paidInstallments} de {loanSummary.installmentsCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Cuotas Pendientes</span>
              <span className="font-medium">
                {loanSummary.pendingInstallments}
              </span>
            </div>

            <div className="mt-4 rounded-md bg-muted p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Progreso</span>
                <span className="font-medium">
                  {progressPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-secondary">
                <div
                  className="h-2 rounded-full bg-green-600 transition-all"
                  style={{
                    width: `${Math.min(progressPercentage, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Plan de Amortización
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedAssociate.loanQuotas.length > 0 ? (
            <div className="max-h-80 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Cuota</TableHead>
                    <TableHead className="text-xs">Vencimiento</TableHead>
                    <TableHead className="text-xs">Capital</TableHead>
                    <TableHead className="text-xs">Interés</TableHead>
                    <TableHead className="text-xs">Total</TableHead>
                    <TableHead className="text-xs">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedAssociate.loanQuotas.map((quota) => (
                    <TableRow key={quota.id}>
                      <TableCell className="text-xs">
                        {quota.installmentNumber}
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(quota.dueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatCurrency(
                          Number(quota.principalAmount),
                          currentCurrencyCode as 'VES' | 'USD'
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatCurrency(
                          Number(quota.interestAmount),
                          currentCurrencyCode as 'VES' | 'USD'
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatCurrency(
                          Number(quota.totalInstallmentAmount),
                          currentCurrencyCode as 'VES' | 'USD'
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge
                          variant={
                            quota.paymentStatus === 'PAID'
                              ? 'success'
                              : quota.paymentStatus === 'OVERDUE'
                                ? 'destructive'
                                : 'outline'
                          }
                        >
                          {PAYMENT_STATUS[
                            quota.paymentStatus as keyof typeof PAYMENT_STATUS
                          ] || quota.paymentStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-center">
              <div className="space-y-2">
                <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No hay cuotas disponibles
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

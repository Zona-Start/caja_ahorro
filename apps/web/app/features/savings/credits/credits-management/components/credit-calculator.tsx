'use client';

import { Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import { Separator } from '@repo/shadcn/separator';

interface AmortRow {
  installmentNumber: number;
  dueDate: string;
  principalAmount: string;
  interestAmount: string;
  totalInstallmentAmount: string;
  principalBalancePending: string;
}

interface CreditCalculatorProps {
  capital: number;
  amortizableAmount: number;
  monthlyPayment: string;
  totalInterest: number;
  schedule: AmortRow[];
  expensesAmount: number;
  haberesPayment: number;
  directPayment: number;
}

function formatCurrency(n: number) {
  return n?.toLocaleString('es', { minimumFractionDigits: 2 }) ?? '0,00';
}

export function CreditCalculator({
  capital,
  amortizableAmount,
  monthlyPayment,
  totalInterest,
  schedule,
  expensesAmount,
  haberesPayment,
  directPayment,
}: CreditCalculatorProps) {
  if (amortizableAmount <= 0 || schedule.length === 0) return null;

  const totalAPagar = capital + totalInterest + expensesAmount;
  const montoAmortizarCuotas = totalAPagar - haberesPayment - directPayment;

  return (
    <Card className="border-emerald-500/30 bg-muted/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          Resumen del Crédito
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Capital:</span>
            <span className="font-mono font-medium">
              {formatCurrency(capital)} Bs
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cuota por Plazo:</span>
            <span className="font-mono font-bold text-[#305AD9]">
              {formatCurrency(parseFloat(monthlyPayment))} Bs
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Interés Total:</span>
            <span className="font-mono">{formatCurrency(totalInterest)} Bs</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gasto Administrativo:</span>
            <span className="font-mono">{formatCurrency(expensesAmount)} Bs</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total a Pagar (Capital + Interés + Gasto):</span>
            <span className="font-mono font-bold text-lg">
              {formatCurrency(totalAPagar)} Bs
            </span>
          </div>
          {haberesPayment > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pago de haberes:</span>
              <span className="font-mono text-destructive">
                - {formatCurrency(haberesPayment)} Bs
              </span>
            </div>
          )}
          {directPayment > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pago directo:</span>
              <span className="font-mono text-destructive">
                - {formatCurrency(directPayment)} Bs
              </span>
            </div>
          )}
          {(haberesPayment > 0 || directPayment > 0) && <Separator />}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Monto a amortizar en cuotas:</span>
            <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(montoAmortizarCuotas)} Bs
            </span>
          </div>
        </div>

        <div className="rounded-lg border bg-background p-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            TABLA DE AMORTIZACIÓN
          </p>
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="py-1 text-left">#</th>
                  <th className="py-1 text-left">Vencimiento</th>
                  <th className="py-1 text-right">Capital</th>
                  <th className="py-1 text-right">Interés</th>
                  <th className="py-1 text-right">Cuota</th>
                  <th className="py-1 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((row) => (
                  <tr key={row.installmentNumber} className="border-b last:border-0">
                    <td className="py-1">{row.installmentNumber}</td>
                    <td className="py-1">
                      {new Date(row.dueDate).toLocaleDateString('es')}
                    </td>
                    <td className="py-1 text-right font-mono">
                      {formatCurrency(parseFloat(row.principalAmount))}
                    </td>
                    <td className="py-1 text-right font-mono">
                      {formatCurrency(parseFloat(row.interestAmount))}
                    </td>
                    <td className="py-1 text-right font-mono">
                      {formatCurrency(parseFloat(row.totalInstallmentAmount))}
                    </td>
                    <td className="py-1 text-right font-mono">
                      {formatCurrency(parseFloat(row.principalBalancePending))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

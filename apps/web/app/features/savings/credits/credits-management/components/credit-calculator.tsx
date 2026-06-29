'use client';

import { useMemo } from 'react';
import { Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';

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
  totalPayable: number;
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
  totalPayable,
  haberesPayment,
  directPayment,
}: CreditCalculatorProps) {
  if (amortizableAmount <= 0 || schedule.length === 0) return null;

  return (
    <Card className="border-emerald-500/30 bg-emerald-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-5 w-5 text-emerald-600" />
          Resumen del Crédito
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Capital:</span>{' '}
            <span className="font-mono font-medium">
              {formatCurrency(capital)} Bs
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Cuota:</span>{' '}
            <span className="font-mono font-bold text-blue-600">
              {formatCurrency(parseFloat(monthlyPayment))} Bs
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Interés Total:</span>{' '}
            <span className="font-mono">{formatCurrency(totalInterest)} Bs</span>
          </div>
          <div>
            <span className="text-muted-foreground">Gasto Admin:</span>{' '}
            <span className="font-mono">{formatCurrency(expensesAmount)} Bs</span>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground">Total a Pagar:</span>{' '}
            <span className="font-mono font-bold text-lg">
              {formatCurrency(totalPayable)} Bs
            </span>
          </div>
        </div>

        {(haberesPayment > 0 || directPayment > 0) && (
          <div className="text-sm space-y-1 bg-blue-50 p-2 rounded">
            <p>
              Monto del crédito:{' '}
              <span className="font-mono font-bold">{formatCurrency(capital)} Bs</span>
            </p>
            {haberesPayment > 0 && (
              <p>
                Pago de haberes:{' '}
                <span className="font-mono text-destructive">
                  - {formatCurrency(haberesPayment)} Bs
                </span>
              </p>
            )}
            {directPayment > 0 && (
              <p>
                Pago directo:{' '}
                <span className="font-mono text-destructive">
                  - {formatCurrency(directPayment)} Bs
                </span>
              </p>
            )}
            <p className="font-semibold">
              Monto a amortizar:{' '}
              <span className="font-mono text-emerald-600">
                {formatCurrency(amortizableAmount)} Bs
              </span>
            </p>
          </div>
        )}

        <div className="rounded-lg border bg-white p-3">
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

'use client';

import { IconWrapper } from '@/components/icon-wrapper';
import { formatCurrency } from '@/lib/format-utils';
import { Badge } from '@repo/shadcn/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/card';
import { Separator } from '@repo/shadcn/separator';
import { CreditCard } from 'lucide-react';
import { type AssociatesLoan } from '../schemas/individual-loan-api-schema';

interface LoanSummaryProps {
  selectedAssociate: AssociatesLoan | null;
  selectedLoanType: {
    id: number;
    name: string;
    interestRate: number;
    termUnits: number;
    administrativeExpensePercentage: number;
  } | null;
  currentCurrencyCode?: string;
  currentExchangeRate?: number;
}

export function LoanSummary({
  selectedAssociate,
  selectedLoanType,
  currentCurrencyCode = 'VES',
  currentExchangeRate,
}: LoanSummaryProps) {
  const fmt = (amount: number | undefined) => {
    if (amount === undefined) return '';
    if (currentCurrencyCode === 'USD' && currentExchangeRate) {
      const converted = amount / currentExchangeRate;
      return formatCurrency(converted, 'USD');
    }
    return formatCurrency(amount, currentCurrencyCode as 'VES' | 'USD');
  };

  if (!selectedAssociate) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Estado de Cuenta</CardTitle>
            <CardDescription>
              Seleccione un asociado para ver su información financiera
            </CardDescription>
          </CardHeader>
          <CardContent className="flex h-56 items-center justify-center text-center">
            <div className="space-y-2">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                La información del asociado se mostrará aquí
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <IconWrapper className="w-6 h-6">
                <CreditCard className="h-4 w-4" />
              </IconWrapper>
              Información del Tipo de Préstamo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-32 items-center justify-center text-center">
              <div className="space-y-2">
                <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  La información del tipo de préstamo se mostrará aquí
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const balance = Number(selectedAssociate.associate.balance);
  const availability = balance * 0.8;
  const baseSalary = Number(selectedAssociate.associate.baseSalary ?? 0);
  const paymentCapacity = baseSalary > 0 ? baseSalary * 0.3 : null;

  const hasBlocks =
    (selectedAssociate?.totalLoans ?? 0) !== 0 ||
    (selectedAssociate?.totalCredits ?? 0) !== 0 ||
    selectedAssociate?.associate?.isPayrollCredit === true;

  const maxRecommended = Math.min(
    availability * 0.9,
    paymentCapacity !== null ? paymentCapacity * 0.9 : Infinity,
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Estado de Cuenta</CardTitle>
            <Badge variant={hasBlocks ? 'destructive' : 'outline'}>
              {hasBlocks ? 'Bloqueado' : 'Sin Bloqueos'}
            </Badge>
          </div>
          <CardDescription>
            Información financiera de {selectedAssociate.associate.fullname}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Ahorros</span>
              <span className="font-medium">{fmt(balance)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">80% de Haberes</span>
              <span className="font-medium">{fmt(availability)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Disponibilidad</span>
              <span className="text-lg font-bold text-green-600">
                {fmt(availability)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Capacidad de Pago</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {paymentCapacity !== null ? (
                  fmt(paymentCapacity)
                ) : (
                  <span className="text-sm font-normal text-muted-foreground">
                    No registrado
                  </span>
                )}
              </span>
            </div>

            <div className="mt-4 rounded-md bg-muted p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Máximo Recomendado</span>
                <span className="font-medium">{fmt(maxRecommended)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <IconWrapper className="w-6 h-6">
              <CreditCard className="h-4 w-4" />
            </IconWrapper>
            Información del Tipo de Préstamo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedLoanType ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tipo</span>
                <span className="font-medium">{selectedLoanType.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Tasa de Interés (Anual)
                </span>
                <span className="font-medium">
                  {selectedLoanType.interestRate} %
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Plazo Máximo (Meses)
                </span>
                <span className="font-medium">
                  {selectedLoanType.termUnits}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Número de Cuotas</span>
                <span className="font-medium">
                  {selectedLoanType.termUnits}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Gasto Administrativo (Anual)
                </span>
                <span className="font-medium">
                  {selectedLoanType.administrativeExpensePercentage} %
                </span>
              </div>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-center">
              <div className="space-y-2">
                <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  La información del tipo de préstamo se mostrará aquí
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

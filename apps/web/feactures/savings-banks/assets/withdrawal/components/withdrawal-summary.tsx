'use client';

import { IconWrapper } from '@/components/icon-wrapper';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/card';
import { Badge } from '@repo/shadcn/components/ui/badge';
import { Separator } from '@repo/shadcn/components/ui/separator';
import { CreditCard } from 'lucide-react';
import { useWithdrawalStore } from '../store/withdrawalStore';

interface LoanSummaryProps {
  currentCurrencyCode: string | undefined;
  currentExchangeRate: number | undefined;
}

export function WithdrawalSummary({
  currentCurrencyCode,
  currentExchangeRate,
}: LoanSummaryProps) {
  const { selectedAssociate, selectedWithdrawlType, enabledTime } =
    useWithdrawalStore();
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) {
      return '';
    }
    if (currentCurrencyCode === 'USD' && currentExchangeRate) {
      return `$${(amount / currentExchangeRate).toFixed(2)}`;
    }
    if (currentCurrencyCode === 'VES') {
      return `Bs. ${amount.toFixed(2)}`;
    }
    return `$${amount.toFixed(2)}`; // Default to USD if currency code is not recognized
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
              <IconWrapper color="indigo" className="w-6 h-6">
                <CreditCard className="h-4 w-4" />
              </IconWrapper>
              Información del Tipo de Retiro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-32 items-center justify-center text-center">
              <div className="space-y-2">
                <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  La información del tipo de retiro se mostrará aquí
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const balance = Number(selectedAssociate.balance);
  const availability = balance * 0.8;
  const maxRecommended = availability * 0.9;

  const hasBlocks = selectedAssociate?.isPayrollCredit === true;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Estado de Cuenta</CardTitle>
            <Badge
              variant={
                hasBlocks
                  ? 'destructive'
                  : !enabledTime
                    ? 'destructive'
                    : 'outline'
              }
            >
              {hasBlocks
                ? 'Bloqueado'
                : !enabledTime
                  ? 'Bloqueado'
                  : 'Sin Bloqueos'}
            </Badge>
          </div>
          <CardDescription>
            Información financiera de {selectedAssociate.fullname}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Ahorros</span>
              <span className="font-medium">{formatCurrency(balance)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">80% de Haberes</span>
              <span className="font-medium">
                {formatCurrency(availability)}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Disponibilidad</span>
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(availability)}
              </span>
            </div>

            <div className="mt-4 rounded-md bg-muted p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Máximo Recomendado</span>
                <span className="font-medium">
                  {formatCurrency(maxRecommended)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <IconWrapper color="indigo" className="w-6 h-6">
              <CreditCard className="h-4 w-4" />
            </IconWrapper>
            Información del Tipo de Retiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedWithdrawlType ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tipo</span>
                <span className="font-medium">
                  {selectedWithdrawlType.description}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Porcentaje maximo retiro
                </span>
                <span className="font-medium">
                  {parseInt(selectedWithdrawlType.withdrawalPercentage)} %
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Tasa de Gastos Administrativo
                </span>
                <span className="font-medium">
                  {parseInt(selectedWithdrawlType.administrativeFeePercentage)}{' '}
                  %
                </span>
              </div>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-center">
              <div className="space-y-2">
                <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  La información del tipo de retiro se mostrará aquí
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

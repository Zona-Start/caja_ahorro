'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/card';
import { Separator } from '@repo/shadcn/components/ui/separator';
import { CreditCard } from 'lucide-react';
import { useSettlementStore } from '../store/settlementStore';

interface settlementSummaryProps {
  currentCurrencyCode: string | undefined;
  currentExchangeRate: number | undefined;
}

export function SettlementSummary({
  currentCurrencyCode,
  currentExchangeRate,
}: settlementSummaryProps) {
  const { selectedAssociate } = useSettlementStore();
  const formatCurrency = (
    amount: number | undefined,
    operations: string | undefined,
  ) => {
    if (amount === undefined) {
      return '';
    }
    console.log('currentCurrencyCode', currentCurrencyCode);

    if (currentCurrencyCode === 'USD' && currentExchangeRate) {
      return `$${(amount / currentExchangeRate).toFixed(2)}`;
    }
    if (currentCurrencyCode === 'VES') {
      return `Bs. ${operations}${amount.toFixed(2)}`;
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
              Seleccione un asociado para ver la información de liquidación
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Estado de Cuenta</CardTitle>
          </div>
          <CardDescription>
            Información de liquidación de {selectedAssociate.fullname}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Aportes Asociado</span>
              <span className="font-medium">
                {formatCurrency(
                  Number(selectedAssociate?.haberes_contribution),
                  '',
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Aportes Empleador</span>
              <span className="font-medium">
                {formatCurrency(
                  Number(selectedAssociate?.haberes_employer),
                  '',
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Aportes Voluntarios</span>
              <span className="font-medium">
                {formatCurrency(
                  Number(selectedAssociate?.haberes_voluntary),
                  '',
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Excedentes</span>
              <span className="font-medium">
                {formatCurrency(Number(selectedAssociate?.surpluses), '')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Retiros</span>
              <span className="font-medium">
                {formatCurrency(
                  Number(selectedAssociate?.total_withdrawals),
                  '-',
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Gastos Administrativos
              </span>
              <span className="font-medium">
                {formatCurrency(
                  Number(selectedAssociate?.total_withdrawal_fees),
                  '-',
                )}
              </span>
            </div>

            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Haberes</span>
              <span className="font-medium">
                {formatCurrency(
                  Number(selectedAssociate?.total_savings_balance),
                  '',
                )}
              </span>
            </div>

            <div className="flex items-center justify-between pt-10">
              <span className="text-sm font-medium">Préstamos Pendientes</span>
              <span className="font-medium">
                {formatCurrency(
                  Number(selectedAssociate?.total_outstanding_loans),
                  '-',
                )}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Creditos Pendientes</span>
              <span className="font-medium">
                {formatCurrency(
                  Number(selectedAssociate?.total_outstanding_credits),
                  '-',
                )}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Monto a liquidar</span>
              <span
                className={`text-lg font-bold ${
                  Number(selectedAssociate?.net_liquidation_amount) > 0
                    ? 'text-green-600' // Verde si el monto es positivo
                    : 'text-red-600' // Rojo si el monto es cero o negativo
                }`}
              >
                {formatCurrency(
                  Number(selectedAssociate?.net_liquidation_amount),
                  Number(selectedAssociate?.net_liquidation_amount) > 0
                    ? ''
                    : '-',
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

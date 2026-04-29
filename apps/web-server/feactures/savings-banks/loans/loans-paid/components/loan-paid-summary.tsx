'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/shadcn/components/ui/table';
import { CreditCard } from 'lucide-react';
import { useLoansPaidStore } from '../store/loansPaidStore';

interface LoanSummaryProps {
  currentCurrencyCode: string | undefined;
  currentExchangeRate: number | undefined;
}

export function LoanSummary({
  currentCurrencyCode,
  currentExchangeRate,
}: LoanSummaryProps) {
  const { selectedAssociate } = useLoansPaidStore();
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
            <CardTitle>Estado de Cuenta Prestamo</CardTitle>
            <CardDescription>
              Seleccione un asociado para ver su información financiera
            </CardDescription>
          </CardHeader>
          <CardContent className="flex h-56 items-center justify-center text-center">
            <div className="space-y-2">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                La información de las cuotas del prestamo se mostrará aquí
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
            <CardTitle>Cuotas Pendientes</CardTitle>
          </div>
          <CardDescription>Detalle de las próximas cuotas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-128 overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cuota</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedAssociate?.loanAmortization?.map((cuota) => (
                  <TableRow
                    key={cuota.quotaNumber}
                    className={
                      cuota.quotaStatus === 'PENDING'
                        ? 'bg-red-50 dark:bg-red-900/20'
                        : cuota.quotaStatus === 'PARTIAL'
                          ? 'bg-yellow-50 dark:bg-yellow-900/20'
                          : 'bg-green-50 dark:bg-green-900/20'
                    }
                  >
                    <TableCell className="font-medium">
                      {cuota.quotaNumber}
                    </TableCell>
                    <TableCell>{cuota.quotaDate}</TableCell>
                    <TableCell className="text-right">
                      {currentCurrencyCode === 'USD' ? '$' : 'Bs '}{' '}
                      {cuota.quotaStatus === 'PARTIAL'
                        ? (
                            Number(cuota.quotaAmount) -
                            Number(cuota.quotaPartial)
                          ).toFixed(2)
                        : cuota?.quotaAmount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

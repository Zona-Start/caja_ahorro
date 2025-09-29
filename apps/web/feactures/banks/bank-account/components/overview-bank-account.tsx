import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import { useBankAccountStore } from '../store/bank-account.store';

export function OverviewLoans() {
  const {
    totalBookBalanceBs,
    totalStatementBalanceBs,
    totalBookBalanceUsd,
    totalStatementBalanceUsd,
  } = useBankAccountStore();

  const formatCurrency = (value: number, currency: 'VES' | 'USD') => {
    const formatted = new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(value);

    if (currency === 'VES') {
      return formatted.replace('Bs.S', 'Bs.');
    }

    return formatted;
  };

  const differenceBs = totalStatementBalanceBs - totalBookBalanceBs;
  const differenceUsd = totalStatementBalanceUsd - totalBookBalanceUsd;

  const getDifferenceColor = (difference: number, total: number) => {
    if (difference === 0) return 'text-green-600';
    if (total === 0) return 'text-gray-500';
    const percentageDiff = Math.abs((difference / total) * 100);
    if (percentageDiff > 1) return 'text-red-600';
    return 'text-orange-500';
  };

  return (
    <div className="space-y-6 mt-4 ">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">
              Saldos Totales (VES)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xl font-bold">
              Libros: {formatCurrency(totalBookBalanceBs, 'VES')}
            </div>
            <div className="text-lg text-muted-foreground">
              Extracto: {formatCurrency(totalStatementBalanceBs, 'VES')}
            </div>
            <div
              className={`text-md font-semibold ${getDifferenceColor(differenceBs, totalBookBalanceBs)}`}
            >
              Diferencia: {formatCurrency(differenceBs, 'VES')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">
              Saldos Totales (USD)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xl font-bold">
              Libros: {formatCurrency(totalBookBalanceUsd, 'USD')}
            </div>
            <div className="text-lg text-muted-foreground">
              Extracto: {formatCurrency(totalStatementBalanceUsd, 'USD')}
            </div>
            <div
              className={`text-md font-semibold ${getDifferenceColor(differenceUsd, totalBookBalanceUsd)}`}
            >
              Diferencia: {formatCurrency(differenceUsd, 'USD')}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

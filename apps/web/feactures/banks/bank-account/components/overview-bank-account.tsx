import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import { useBankAccountStore } from '../store/bank-account.store';

export function OverviewLoans() {
  const { totalBalanceBs, totalBalanceUsd } = useBankAccountStore();

  const formatCurrency = (value: number, currency: 'VES' | 'USD') => {
    const formatted = new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(value);

    // If the currency is VES, replace "Bs.S" with "Bs."
    if (currency === 'VES') {
      return formatted.replace('Bs.S', 'Bs.');
    }

    return formatted;
  };

  return (
    <div className="space-y-6 mt-4 ">
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">
              Saldo Total (VES)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {' '}
              {formatCurrency(totalBalanceBs, 'VES')}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">
              Saldo Total (USD)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalBalanceUsd, 'USD')}{' '}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

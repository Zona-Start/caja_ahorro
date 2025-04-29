import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import { useBankAccountStore } from '../store/bank-account.store';

export function OverviewLoans() {
  const { totalBalanceBs, totalBalanceUsd } = useBankAccountStore();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
      minimumFractionDigits: 2,
    }).format(value);

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
              {formatCurrency(totalBalanceBs)}
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
              {formatCurrency(totalBalanceUsd)}{' '}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

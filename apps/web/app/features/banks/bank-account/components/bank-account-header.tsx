import { Heading } from '@repo/shadcn/heading';
import { Card, CardContent } from '@repo/shadcn/card';
import { Skeleton } from '@repo/shadcn/skeleton';
import { cn } from '@repo/shadcn/lib/utils';
import { formatCurrency } from '@/lib/format-utils';
import { useBankAccountBalancesByCurrency } from '../hooks/use-bank-account-query';
import { CURRENCY_CODE_OPTIONS } from '../schemas/bank-account-options';

export function BankAccountHeader() {
  const { data: balancesData, isLoading } = useBankAccountBalancesByCurrency();
  const balances = balancesData?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Heading
          title="Cuentas Bancarias"
          description="Gestiona las cuentas bancarias de tu empresa"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-6 w-32 mb-1" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : balances.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {balances.map((b) => {
            const currencyLabel =
              CURRENCY_CODE_OPTIONS[
                b.currencyCode as keyof typeof CURRENCY_CODE_OPTIONS
              ] || b.currencyCode;
            const hasDifference = Math.abs(b.difference) > 0.001;

            return (
              <Card key={b.currencyCode}>
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {currencyLabel}
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        Según Libros
                      </span>
                      <span className="text-sm font-semibold">
                        {formatCurrency(b.bookBalance, b.currencyCode)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        Según Extracto
                      </span>
                      <span className="text-sm font-semibold">
                        {b.statementBalance != null
                          ? formatCurrency(b.statementBalance, b.currencyCode)
                          : '-'}
                      </span>
                    </div>
                    {hasDifference && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          Diferencia
                        </span>
                        <span
                          className={cn(
                            'text-sm font-bold',
                            b.difference > 0
                              ? 'text-green-600'
                              : 'text-red-600',
                          )}
                        >
                          {formatCurrency(
                            Math.abs(b.difference),
                            b.currencyCode,
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

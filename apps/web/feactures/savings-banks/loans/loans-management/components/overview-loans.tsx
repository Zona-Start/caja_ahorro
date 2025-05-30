'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import { useQueryLoanManagementAllCount } from '../hooks/use-query-loans-management';

export function OverviewLoans() {
  const { data } = useQueryLoanManagementAllCount();
  return (
    <div className="space-y-6 mt-4 ">
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Préstamos Ordinarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.totalLoansOrdinary === null ? 0 : data?.totalLoansOrdinary}
            </div>
            <p className="text-xs text-muted-foreground">Activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Préstamos Cuotas Especiales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.totalLoanSpecialQuotas === null
                ? 0
                : data?.totalLoanSpecialQuotas}
            </div>
            <p className="text-xs text-muted-foreground">Activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Préstamos Pagados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {' '}
              {data?.totalLoanPaid === null ? 0 : data?.totalLoanPaid}
            </div>
            <p className="text-xs text-muted-foreground">Completados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Préstamos por pagar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.totalLoanInPaymet === null ? 0 : data?.totalLoanInPaymet}
            </div>
            <p className="text-xs text-muted-foreground">En proceso de pago</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

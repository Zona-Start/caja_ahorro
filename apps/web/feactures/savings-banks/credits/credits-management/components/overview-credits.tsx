'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import { useQueryCreditManagementAllCount } from '../hooks/use-query-credits-management';

export function OverviewLoans() {
  const { data } = useQueryCreditManagementAllCount();
  return (
    <div className="space-y-6 mt-4 ">
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Créditos Ordinarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.totalCreditOrdinary === null
                ? 0
                : data?.totalCreditOrdinary}
            </div>
            <p className="text-xs text-muted-foreground">Activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Créditos Cuotas Especiales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.totalCreditSpecialQuotas === null
                ? 0
                : data?.totalCreditSpecialQuotas}
            </div>
            <p className="text-xs text-muted-foreground">Activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Créditos Pagados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {' '}
              {data?.totalCreditPaid === null ? 0 : data?.totalCreditPaid}
            </div>
            <p className="text-xs text-muted-foreground">Completados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Créditos por pagar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.totalCreditInPaymet === null
                ? 0
                : data?.totalCreditInPaymet}
            </div>
            <p className="text-xs text-muted-foreground">En proceso de pago</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

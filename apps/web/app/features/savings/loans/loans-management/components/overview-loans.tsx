'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import { useQueryLoansManagementCount } from '../hooks/use-loans-management-query';

export function OverviewLoans() {
  const { data } = useQueryLoansManagementCount();
  const stats = (data ?? {}) as {
    total: number;
    pending: number;
    approved: number;
    disbursed: number;
    rejected: number;
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Préstamos Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending ?? 0}</div>
            <p className="text-xs text-muted-foreground">En solicitud</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Préstamos Aprobados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.approved ?? 0}</div>
            <p className="text-xs text-muted-foreground">Listos para desembolso</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Préstamos Desembolsados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.disbursed ?? 0}</div>
            <p className="text-xs text-muted-foreground">Activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Préstamos Rechazados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.rejected ?? 0}</div>
            <p className="text-xs text-muted-foreground">Finalizados</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

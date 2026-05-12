'use client';

import { Heading } from '@repo/shadcn/heading';
import { useQueryCreditManagementCount } from '../hooks/use-credits-management-query';

export function OrdinaryCreditsHeader() {
  const { data } = useQueryCreditManagementCount();
  const stats = data as {
    totalCreditOrdinary: number;
    totalCreditSpecialQuotas: number;
    totalCreditPaid: number;
    totalCreditInPaymet: number;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <Heading
          title="Créditos"
          description="Gestiona los Créditos de los Asociados"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6 pb-2">
            <div className="text-sm font-medium">Créditos Ordinarios</div>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">
              {stats?.totalCreditOrdinary ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Activos y pendientes</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6 pb-2">
            <div className="text-sm font-medium">Cuotas Especiales</div>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">
              {stats?.totalCreditSpecialQuotas ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Activos y pendientes</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6 pb-2">
            <div className="text-sm font-medium">En Pago</div>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">
              {stats?.totalCreditInPaymet ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Actualmente pagándose</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6 pb-2">
            <div className="text-sm font-medium">Pagados</div>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">
              {stats?.totalCreditPaid ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Finalizados</p>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { Badge } from '@repo/shadcn/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/card';
import { Separator } from '@repo/shadcn/separator';
import { CreditCard } from 'lucide-react';
import { type SearchAssociateResult } from '../schemas/credits-management-api-response';

interface CreditSummaryProps {
  selectedAssociate: SearchAssociateResult | null;
}

function formatCurrency(n: number) {
  return n?.toLocaleString('es', { minimumFractionDigits: 2 }) ?? '0,00';
}

export function CreditSummary({ selectedAssociate }: CreditSummaryProps) {
  if (!selectedAssociate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estado de Cuenta</CardTitle>
          <CardDescription>
            Seleccione un asociado para ver su información financiera
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
    );
  }

  const balance = selectedAssociate.balance;
  const availability = selectedAssociate.available80;
  const maxRecommended = availability * 0.9;

  const hasBlocks =
    selectedAssociate.hasActiveLoan ||
    selectedAssociate.hasActiveCredit ||
    selectedAssociate.hasPayrollCredit;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Estado de Cuenta</CardTitle>
          <Badge variant={hasBlocks ? 'destructive' : 'outline'}>
            {hasBlocks ? 'Bloqueado' : 'Sin Bloqueos'}
          </Badge>
        </div>
        <CardDescription>
          Información financiera de {selectedAssociate.associate.fullname}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Ahorros</span>
            <span className="font-medium">{formatCurrency(balance)} Bs</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">80% de Haberes</span>
            <span className="font-medium">{formatCurrency(availability)} Bs</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Disponibilidad</span>
            <span className="text-lg font-bold text-emerald-600">
              {formatCurrency(availability)} Bs
            </span>
          </div>
          <div className="rounded-md bg-muted p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Capacidad de Pago (30%)</span>
              <span className="font-medium">
                {formatCurrency(selectedAssociate.paymentCapacity)} Bs/mes
              </span>
            </div>
          </div>
          <div className="rounded-md bg-muted p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Máximo Recomendado</span>
              <span className="font-medium">
                {formatCurrency(maxRecommended)} Bs
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { IconWrapper } from '@/components/icon-wrapper';
import { Badge } from '@repo/shadcn/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/card';
import { Separator } from '@repo/shadcn/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/shadcn/table';
import { CreditCard, DollarSign } from 'lucide-react';
import type { AssociatesCredit } from '../schemas/individual-credits-api-schema';

interface CreditPaidSummaryProps {
  selectedAssociate: AssociatesCredit | null;
}

export function CreditPaidSummary({
  selectedAssociate,
}: CreditPaidSummaryProps) {
  if (!selectedAssociate) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumen del Crédito</CardTitle>
            <CardDescription>
              Seleccione un asociado para ver el detalle del crédito
            </CardDescription>
          </CardHeader>
          <CardContent className="flex h-56 items-center justify-center text-center">
            <div className="space-y-2">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                La información del crédito se mostrará aquí
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <IconWrapper className="w-6 h-6">
                <DollarSign className="h-4 w-4" />
              </IconWrapper>
              Tabla de Amortización
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-32 items-center justify-center text-center">
              <div className="space-y-2">
                <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  La tabla de amortización se mostrará aquí
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const quotas = selectedAssociate.quotas || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Resumen del Crédito</CardTitle>
            <Badge variant="outline">{selectedAssociate.status}</Badge>
          </div>
          <CardDescription>
            Detalle del crédito de {selectedAssociate.associate.fullname}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Tipo de Crédito</span>
              <span className="font-medium">
                {selectedAssociate.creditTypeName || '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Monto Aprobado</span>
              <span className="font-medium">
                ${Number(selectedAssociate.approvedAmount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Tasa de Interés</span>
              <span className="font-medium">
                {Number(selectedAssociate.interestRate).toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Plazo</span>
              <span className="font-medium">
                {selectedAssociate.termMonths} meses
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Cuota Mensual</span>
              <span className="font-medium">
                ${Number(selectedAssociate.installmentAmount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Pagado</span>
              <span className="font-medium text-green-600">
                ${Number(selectedAssociate.totalPaid).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Saldo Pendiente</span>
              <span className="text-lg font-bold text-orange-600">
                ${Number(selectedAssociate.outstandingBalance).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Cuotas Pagadas</span>
              <span className="font-medium">
                {selectedAssociate.installmentsPaid} de{' '}
                {selectedAssociate.installmentsCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Próximo Pago</span>
              <span className="font-medium">
                {selectedAssociate.nextPaymentDate
                  ? new Date(selectedAssociate.nextPaymentDate).toLocaleDateString('es-VE')
                  : '-'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <IconWrapper className="w-6 h-6">
              <DollarSign className="h-4 w-4" />
            </IconWrapper>
            Tabla de Amortización
          </CardTitle>
        </CardHeader>
        <CardContent>
          {quotas.length > 0 ? (
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">#</TableHead>
                    <TableHead className="text-xs">Vence</TableHead>
                    <TableHead className="text-xs">Capital</TableHead>
                    <TableHead className="text-xs">Interés</TableHead>
                    <TableHead className="text-xs">Cuota</TableHead>
                    <TableHead className="text-xs">Saldo</TableHead>
                    <TableHead className="text-xs">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotas.map((quota) => (
                    <TableRow key={quota.quotaNumber}>
                      <TableCell className="text-xs">
                        {quota.quotaNumber}
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(quota.dueDate).toLocaleDateString('es-VE')}
                      </TableCell>
                      <TableCell className="text-xs">
                        ${Number(quota.principal).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-xs">
                        ${Number(quota.interest).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-xs">
                        ${Number(quota.amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-xs">
                        ${Number(quota.balance).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge
                          variant={
                            quota.status === 'PAID' ? 'default' : 'outline'
                          }
                          className="text-xs"
                        >
                          {quota.status === 'PAID' ? 'Pagada' : 'Pendiente'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-center">
              <div className="space-y-2">
                <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No hay cuotas registradas para este crédito
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

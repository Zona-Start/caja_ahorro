'use client';

import { Card, CardContent } from '@repo/shadcn/components/ui/card';
import { DataTableSkeleton } from '@repo/shadcn/components/ui/table/data-table-skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/shadcn/table';
import { z } from 'zod';
import {
  PAYMENT_METHOD_TYPES,
  WITHDRAWAL_STATUS_TYPES,
} from '../../schemas/inquiry-options';
import { withdrawalsResponseSchema } from '../../schemas/inquiry-schema';

type WithdrawalsData = z.infer<typeof withdrawalsResponseSchema> | undefined;

interface WithdrawalsTabProps {
  data: WithdrawalsData;
  isLoading: boolean;
  isError: boolean;
}

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

const AuxiliarComponents = ({
  text,
  color,
}: {
  text: string;
  color?: string;
}) => {
  return (
    <Card>
      <CardContent className="space-y-2">
        <p className={color ? text : 'text-center mt-6'}>{text}</p>
      </CardContent>
    </Card>
  );
};

export function WithdrawalsTab({
  data,
  isLoading,
  isError,
}: WithdrawalsTabProps) {
  if (isLoading) return <DataTableSkeleton columnCount={5} />;
  if (isError)
    return (
      <AuxiliarComponents
        text="Error al cargar los retiros."
        color="text-red-500"
      />
    );

  if (!data || data.data.length === 0)
    return <AuxiliarComponents text="No hay retiros para mostrar." />;

  return (
    <Card>
      <CardContent className="space-y-2">
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Método de Pago</TableHead>
              <TableHead>Estatus</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((w, index) => (
              <TableRow key={index}>
                <TableCell>
                  {new Date(w.withdrawalDate).toLocaleDateString('es-VE')}
                </TableCell>
                <TableCell>{w.description}</TableCell>
                <TableCell>{formatCurrency(Number(w.amount), 'VES')}</TableCell>
                <TableCell>
                  {PAYMENT_METHOD_TYPES[
                    w.paymentMethod as keyof typeof PAYMENT_METHOD_TYPES
                  ] || w.paymentMethod}
                </TableCell>
                <TableCell>
                  {WITHDRAWAL_STATUS_TYPES[
                    w.status as keyof typeof WITHDRAWAL_STATUS_TYPES
                  ] || w.status}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

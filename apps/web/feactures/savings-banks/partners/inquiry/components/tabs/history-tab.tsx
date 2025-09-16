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
import { MOVEMENT_TYPES } from '../../schemas/inquiry-options';
import { transactionHistoryResponseSchema } from '../../schemas/inquiry-schema';

type HistoryData = z.infer<typeof transactionHistoryResponseSchema> | undefined;

interface TransactionHistoryTabProps {
  data: HistoryData;
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

export function TransactionHistoryTab({
  data,
  isLoading,
  isError,
}: TransactionHistoryTabProps) {
  if (isLoading) return <DataTableSkeleton columnCount={5} />;
  if (isError)
    return (
      <AuxiliarComponents
        text="Error al cargar el historial."
        color="text-red-500"
      />
    );
  if (!data || data.data.length === 0)
    return <AuxiliarComponents text="No hay Movimientos para mostrar." />;

  return (
    <Card>
      <CardContent className="space-y-2">
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Referencia</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Descripción</TableHead>

              <TableHead>Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((t, index) => (
              <TableRow key={index}>
                <TableCell>
                  {new Date(t.fecha).toLocaleDateString('es-VE')}
                </TableCell>
                <TableCell>{t.numeroReferencia}</TableCell>
                <TableCell>
                  {MOVEMENT_TYPES[t.tipo as keyof typeof MOVEMENT_TYPES] ||
                    t.tipo}
                </TableCell>
                <TableCell>{t.descripcion}</TableCell>

                <TableCell>Bs. {t.monto}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

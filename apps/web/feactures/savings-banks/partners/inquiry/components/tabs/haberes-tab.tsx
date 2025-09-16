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
import { haberesMovementsResponseSchema } from '../../schemas/inquiry-schema';

type HaberesData = z.infer<typeof haberesMovementsResponseSchema> | undefined;

interface HaberesTabProps {
  data: HaberesData;
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

export function HaberesTab({ data, isLoading, isError }: HaberesTabProps) {
  if (isLoading) return <DataTableSkeleton columnCount={4} />;
  if (isError)
    return (
      <AuxiliarComponents
        text="Error al cargar los movimientos de haberes."
        color="text-red-500"
      />
    );

  if (!data || data.data.length === 0)
    return (
      <AuxiliarComponents text="No hay movimientos de haberes para mostrar." />
    );

  return (
    <Card>
      <CardContent className="space-y-2">
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Concepto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((mov, index) => (
              <TableRow key={index}>
                <TableCell>
                  {new Date(mov.fecha).toLocaleDateString('es-VE')}
                </TableCell>
                <TableCell>{mov.concepto}</TableCell>
                <TableCell>
                  {MOVEMENT_TYPES[mov.tipo as keyof typeof MOVEMENT_TYPES] ||
                    mov.tipo}
                </TableCell>
                <TableCell>
                  Bs. {formatCurrency(Number(mov.monto), 'VES')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

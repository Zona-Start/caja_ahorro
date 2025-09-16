'use client';

import { Badge } from '@repo/shadcn/badge';
import { Card, CardContent } from '@repo/shadcn/components/ui/card';
import { DataTableSkeleton } from '@repo/shadcn/components/ui/table/data-table-skeleton';
import { Progress } from '@repo/shadcn/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/shadcn/table';
import { z } from 'zod';
import { CREDIT_STATUS_TYPES } from '../../schemas/inquiry-options';
import { creditsResponseSchema } from '../../schemas/inquiry-schema';

type CreditsData = z.infer<typeof creditsResponseSchema> | undefined;

interface CreditsTabProps {
  data: CreditsData;
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

export function CreditsTab({ data, isLoading, isError }: CreditsTabProps) {
  if (isLoading) return <DataTableSkeleton columnCount={6} />;
  if (isError)
    return (
      <AuxiliarComponents
        text="Error al cargar los créditos."
        color="text-red-500"
      />
    );
  if (!data || data.data.length === 0)
    return <AuxiliarComponents text="No hay créditos para mostrar." />;

  const capitalizeFirstLetter = (str: string | null) => {
    if (!str) return ''; // Maneja casos nulos o vacíos
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  return (
    <Card>
      <CardContent className="space-y-2">
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Monto Solicitado</TableHead>
              <TableHead>Saldo Pendiente</TableHead>
              <TableHead>Progreso</TableHead>
              <TableHead>Fecha Sol.</TableHead>
              <TableHead>Estatus</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((credit, index) => (
              <TableRow key={index}>
                <TableCell>
                  {capitalizeFirstLetter(credit.creditType)}
                </TableCell>
                <TableCell>
                  {formatCurrency(Number(credit.creditAmount), 'VES')}
                </TableCell>
                <TableCell>
                  {formatCurrency(Number(credit.outstandingBalance), 'VES')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={parseFloat(credit.progress) * 10}
                      className="w-[60%]"
                    />
                    <span>{parseFloat(credit.progress).toFixed(1)}/10</span>
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(credit.requestDate).toLocaleDateString('es-VE')}
                </TableCell>

                <TableCell>
                  <Badge variant="outline">
                    {CREDIT_STATUS_TYPES[
                      credit.status as keyof typeof CREDIT_STATUS_TYPES
                    ] || credit.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

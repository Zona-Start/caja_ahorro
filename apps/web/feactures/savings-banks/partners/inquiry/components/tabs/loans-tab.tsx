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
import { LOAN_STATUS_TYPES } from '../../schemas/inquiry-options';
import { loansResponseSchema } from '../../schemas/inquiry-schema';

type LoansData = z.infer<typeof loansResponseSchema> | undefined;

interface LoansTabProps {
  data: LoansData;
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

export function LoansTab({ data, isLoading, isError }: LoansTabProps) {
  if (isLoading) return <DataTableSkeleton columnCount={6} />;
  if (isError)
    return (
      <AuxiliarComponents
        text="Error al cargar los préstamos."
        color="text-red-500"
      />
    );

  if (!data || data.data.length === 0)
    return <AuxiliarComponents text="No hay préstamos para mostrar." />;

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
            {data.data.map((loan, index) => (
              <TableRow key={index}>
                <TableCell>{loan.loanType}</TableCell>
                <TableCell>
                  {formatCurrency(Number(loan.loanAmount), 'VES')}
                </TableCell>
                <TableCell>
                  {formatCurrency(Number(loan.outstandingBalance), 'VES')}
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={parseFloat(loan.progress) * 10}
                      className="w-[60%]"
                    />
                    <span>{parseFloat(loan.progress).toFixed(1)}/10</span>
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(loan.requestDate).toLocaleDateString('es-VE')}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {LOAN_STATUS_TYPES[
                      loan.status as keyof typeof LOAN_STATUS_TYPES
                    ] || loan.status}
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

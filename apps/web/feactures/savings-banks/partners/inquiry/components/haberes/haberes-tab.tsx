'use client';

import { Card, CardContent } from '@repo/shadcn/components/ui/card';
import { DataTable } from '@repo/shadcn/components/ui/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/components/ui/table/data-table-skeleton';
import { useHaberesMovements } from '../../hooks/use-inquiry-queries';
import { columns } from './haberes-tables/columns';

interface HaberesTabProps {
  id: number;
  //data: HaberesData[];
  // isLoading: boolean;
  // isError: boolean;
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

export function HaberesTab({ id }: HaberesTabProps) {
  const {
    data: haberesData,
    isLoading: haberesLoading,
    isError: haberesIsError,
  } = useHaberesMovements(id, { enabled: Boolean(id) });

  if (haberesLoading) return <DataTableSkeleton columnCount={4} />;
  if (haberesIsError)
    return (
      <AuxiliarComponents
        text="Error al cargar los movimientos de haberes."
        color="text-red-500"
      />
    );

  if (!haberesData || haberesData?.data.length === 0)
    return (
      <AuxiliarComponents text="No hay movimientos de haberes para mostrar." />
    );

  return (
    <DataTable
      columns={columns}
      data={haberesData?.data || []}
      totalItems={haberesData?.data.length} // Asegúrate que tu API devuelva este valor
    />
  );
}

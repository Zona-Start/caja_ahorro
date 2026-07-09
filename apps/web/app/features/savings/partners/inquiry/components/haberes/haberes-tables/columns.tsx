import { formatCurrency } from '@/lib/format-utils';
import { Badge } from '@repo/shadcn/badge';
import type { ColumnDef } from '@tanstack/react-table';
import { MOVEMENT_TYPES } from '../../../schemas/inquiry-options';
import type { HaberesMovement } from '../../../schemas/inquiry-schema';

export const columns: ColumnDef<HaberesMovement>[] = [
  {
    accessorKey: 'fecha',
    header: 'Fecha',
    cell: ({ row }) => {
      const fecha = row.original.fecha;
      if (!fecha) return <span className="text-muted-foreground">N/A</span>;
      return new Date(fecha).toLocaleDateString('es-VE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    },
  },
  {
    accessorKey: 'tipo',
    header: 'Tipo de Aporte',
    cell: ({ row }) => {
      const tipo = row.original.tipo;
      const label =
        MOVEMENT_TYPES[tipo as keyof typeof MOVEMENT_TYPES] || tipo;
      const variant = (() => {
        switch (tipo) {
          case 'SAVING_CONTRIBUTION':
            return 'default';
          case 'EMPLOYER_CONTRIBUTION':
            return 'secondary';
          case 'VOLUNTARY_SAVINGS':
            return 'outline';
          case 'DIVIDEND_CREDIT':
            return 'success';
          default:
            return 'default';
        }
      })();
      return (
        <Badge variant={variant as any} className="text-xs">
          {label}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'concepto',
    header: 'Concepto',
    cell: ({ row }) => {
      const concepto = row.original.concepto;
      return (
        <span className={concepto ? '' : 'text-muted-foreground italic'}>
          {concepto || 'Sin descripción'}
        </span>
      );
    },
  },
  {
    accessorKey: 'monto',
    header: 'Monto',
    cell: ({ row }) => {
      const monto = Number(row.original.monto);
      return (
        <span className="font-mono font-medium text-emerald-600">
          {formatCurrency(monto, 'VES')}
        </span>
      );
    },
  },
];

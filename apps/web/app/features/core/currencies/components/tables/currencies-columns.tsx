import { Badge } from '@repo/shadcn/badge';
import type { ColumnDef } from '@tanstack/react-table';
import { Currency } from '../../schemas/currencies.schema';
import { CurrenciesCellAction } from './currencies-cell-action';

export const currenciesColumns: ColumnDef<Currency>[] = [
  {
    accessorKey: 'code',
    header: 'Código',
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original.code}</Badge>
    ),
  },
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    accessorKey: 'symbol',
    header: 'Símbolo',
  },
  {
    accessorKey: 'isBase',
    header: 'Base',
    cell: ({ row }) => (
      row.original.isBase ? (
        <Badge variant="default">Base</Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    ),
  },
  {
    accessorKey: 'isActive',
    header: 'Estado',
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? 'success' : 'secondary'}>
        {row.original.isActive ? 'Activo' : 'Inactivo'}
      </Badge>
    ),
  },
  {
    accessorKey: 'decimalPlaces',
    header: 'Decimales',
  },
  {
    id: 'actions',
    header: () => <div className="text-center">Acciones</div>,
    cell: ({ row }) => (
      <div className="text-center">
        <CurrenciesCellAction data={row.original} />
      </div>
    ),
  },
];
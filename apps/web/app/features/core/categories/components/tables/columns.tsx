import { type ColumnDef } from '@tanstack/react-table';
import type { Category } from '../../schemas/categories.schema';
import { TYPE_LABELS } from '../../schemas/categories.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Category>[] = [
  {
    accessorKey: 'type',
    header: 'Tipo',
    cell: ({ getValue }) => {
      const value = getValue<string>();
      return TYPE_LABELS[value] || value;
    },
  },
  {
    accessorKey: 'code',
    header: 'Código',
  },
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    accessorKey: 'isActive',
    header: 'Estado',
    cell: ({ getValue }) => (getValue() ? 'Activo' : 'Inactivo'),
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
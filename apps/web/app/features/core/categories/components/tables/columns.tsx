import { type ColumnDef } from '@tanstack/react-table';
import type { Category } from '../../schemas/categories.schema';
import { CATEGORY_TYPES } from '../../schemas/categories.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Category>[] = [
  {
    accessorKey: 'type',
    header: 'Tipo',
    cell: ({ getValue }) => {
      const value = getValue<string>();
      const label = CATEGORY_TYPES[value as keyof typeof CATEGORY_TYPES] || value;
      return label;
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
    accessorKey: 'description',
    header: 'Descripción',
    cell: ({ getValue }) => getValue() || '-',
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
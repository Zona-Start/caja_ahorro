import type { ColumnDef } from '@tanstack/react-table';
import type { Category } from '../../schemas/categories.schema';
import { GROUP_TYPE_OPTIONS } from '../../schemas/categories-options';
import { CategoriesCellAction } from './cell-action';

const getGroupLabel = (value: string) => {
  return GROUP_TYPE_OPTIONS.find((opt) => opt.value === value)?.label || value;
};

export const categoriesColumns: ColumnDef<Category>[] = [
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    accessorKey: 'group',
    header: 'Grupo',
    cell: ({ row }) => getGroupLabel(row.original.group),
  },
  {
    accessorKey: 'description',
    header: 'Descripción',
    cell: ({ row }) => row.original.description || '-',
  },
  {
    id: 'actions',
    header: () => <div className="text-center">Acciones</div>,
    cell: ({ row }) => (
      <div className="text-center">
        <CategoriesCellAction data={row.original} />
      </div>
    ),
  },
];

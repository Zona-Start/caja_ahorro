import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@repo/shadcn/badge';
import type { Category } from '../../schemas/categories.schema';
import { TYPE_LABELS } from '../../schemas/categories.schema';
import { CellAction } from './cell-action';

export function createCategoriesColumns(
  isSuperAdmin: boolean,
  tenantNames?: Record<string, string>,
): ColumnDef<Category>[] {
  const cols: ColumnDef<Category>[] = [
    {
      accessorKey: 'code',
      header: 'Código',
    },
    {
      accessorKey: 'name',
      header: 'Nombre',
    },
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ getValue }) => {
        const value = getValue<string>();
        return TYPE_LABELS[value] || value;
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Estado',
      cell: ({ getValue }) => {
        const active = getValue<boolean>();
        return (
          <Badge variant="outline" className={active ? 'text-green-600 border-green-300' : 'text-red-500 border-red-300'}>
            {active ? 'Activo' : 'Inactivo'}
          </Badge>
        );
      },
    },
  ];

  if (isSuperAdmin) {
    cols.splice(2, 0, {
      accessorKey: 'tenantId',
      header: 'Cliente',
      cell: ({ getValue }) => {
        const tid = getValue<string>();
        return tenantNames?.[tid] || tid;
      },
    });
  }

  cols.push({
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  });

  return cols;
}

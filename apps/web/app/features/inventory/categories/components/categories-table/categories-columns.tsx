import type { ColumnDef } from '@tanstack/react-table';
import type { Category } from '../../schemas/categories.schema';
import { GROUP_TYPE_OPTIONS } from '../../schemas/categories-options';
import { CategoriesCellAction } from './categories-cell-action';

const getGroupLabel = (value: string) => {
  return GROUP_TYPE_OPTIONS.find((opt) => opt.value === value)?.label || value;
};

export function createCategoriesColumns(
  isSuperAdmin: boolean,
  tenantNames?: Record<string, string>,
): ColumnDef<Category>[] {
  const columns: ColumnDef<Category>[] = [
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

  if (isSuperAdmin) {
    columns.unshift({
      accessorKey: 'tenantId',
      header: 'Empresa',
      cell: ({ row }) => {
        const name = tenantNames?.[row.original.tenantId ?? ''];
        return (
          <span className="truncate block max-w-[200px]" title={name ?? row.original.tenantId ?? 'N/A'}>
            {name ?? row.original.tenantId?.slice(0, 8) ?? 'N/A'}
          </span>
        );
      },
    });
  }

  return columns;
}

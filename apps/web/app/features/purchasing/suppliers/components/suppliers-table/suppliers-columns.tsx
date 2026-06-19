import { Badge } from '@repo/shadcn/badge';
import type { ColumnDef } from '@tanstack/react-table';
import type { Supplier } from '../../schemas/suppliers.schema';
import { CATEGORY_OPTIONS, STATUS_OPTIONS } from '../../schemas/suppliers-options';
import { SuppliersCellAction } from './suppliers-cell-action';

const getCategoryLabel = (value: string) =>
  CATEGORY_OPTIONS.find((c) => c.value === value)?.label ?? value;

const getStatusLabel = (value: string) =>
  STATUS_OPTIONS.find((s) => s.value === value)?.label ?? value;

export function createSuppliersColumns(
  isSuperAdmin: boolean,
  tenantNames?: Record<string, string>,
): ColumnDef<Supplier>[] {
  const columns: ColumnDef<Supplier>[] = [
    {
      accessorKey: 'name',
      header: 'Nombre',
    },
    {
      accessorKey: 'taxId',
      header: 'ID Fiscal',
    },
    {
      accessorKey: 'category',
      header: 'Categoría',
      cell: ({ row }) => getCategoryLabel(row.original.category),
    },
    {
      accessorKey: 'contactName',
      header: 'Contacto',
      cell: ({ row }) => row.original.contactName || 'N/A',
    },
    {
      accessorKey: 'phone',
      header: 'Teléfono',
      cell: ({ row }) => row.original.phone || 'N/A',
    },
    {
      accessorKey: 'email',
      header: 'Correo',
      cell: ({ row }) => row.original.email || 'N/A',
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge variant="outline" className={status === 'ACTIVE' ? 'text-green-600 border-green-300' : 'text-red-500 border-red-300'}>
            {getStatusLabel(status)}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-center">Acciones</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <SuppliersCellAction data={row.original} />
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

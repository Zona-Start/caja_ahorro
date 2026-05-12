import { Badge } from '@repo/shadcn/badge';
import type { ColumnDef } from '@tanstack/react-table';
import type { Supplier } from '../../schemas/suppliers.schema';
import { CATEGORY_OPTIONS, STATUS_OPTIONS } from '../../schemas/suppliers-options';
import { SuppliersCellAction } from './cell-action';

const getCategoryLabel = (value: string) =>
  CATEGORY_OPTIONS.find((c) => c.value === value)?.label ?? value;

const getStatusLabel = (value: string) =>
  STATUS_OPTIONS.find((s) => s.value === value)?.label ?? value;

const getStatusVariant = (value: string): 'success' | 'destructive' | 'outline' | 'secondary' => {
  switch (value) {
    case 'active':
      return 'success';
    case 'inactive':
      return 'destructive';
    case 'suspended':
      return 'secondary';
    default:
      return 'outline';
  }
};

export const suppliersColumns: ColumnDef<Supplier>[] = [
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
    accessorKey: 'contactPhone',
    header: 'Teléfono',
    cell: ({ row }) => row.original.contactPhone || 'N/A',
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant={getStatusVariant(status)}>
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

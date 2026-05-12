import { Badge } from '@repo/shadcn/badge';
import type { ColumnDef } from '@tanstack/react-table';
import type { Product } from '../../schemas/products.schema';
import { CellAction } from './cell-action';
import { formatCurrency } from '@/lib/format-utils';

const statusTranslations: Record<string, string> = {
  AVAILABLE: 'Disponible',
  DISABLED: 'Deshabilitado',
  OUT_OF_STOCK: 'Agotado',
  COMMING_SOON: 'Próximamente',
  ON_SALE: 'En oferta',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  AVAILABLE: 'default',
  DISABLED: 'secondary',
  OUT_OF_STOCK: 'destructive',
  COMMING_SOON: 'outline',
  ON_SALE: 'outline',
};

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    accessorKey: 'categoryId',
    header: 'Categoría',
    cell: ({ row }) => {
      return <span>{row.original.categoryId || '-'}</span>;
    },
  },
  {
    accessorKey: 'brand',
    header: 'Marca',
    cell: ({ row }) => row.original.brand || '-',
  },
  {
    accessorKey: 'model',
    header: 'Modelo',
    cell: ({ row }) => row.original.model || '-',
  },
  {
    accessorKey: 'stockMin',
    header: 'Stock',
    cell: ({ row }) => {
      const { stockMin, stockMax } = row.original;
      return <span>{stockMin} / {stockMax}</span>;
    },
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant={statusVariants[status] || 'secondary'}>
          {statusTranslations[status] || status}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'supplierCost',
    header: 'Precio',
    cell: ({ row }) => {
      const cost = Number(row.original.supplierCost);
      return formatCurrency(cost, 'USD');
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];

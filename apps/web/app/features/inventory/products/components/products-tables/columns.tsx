import { Badge } from '@repo/shadcn/badge';
import type { ColumnDef } from '@tanstack/react-table';
import type { Product } from '../../schemas/products.schema';
import { CellAction } from './cell-action';

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
  { accessorKey: 'name', header: 'Nombre' },
  {
    accessorKey: 'sku',
    header: 'SKU',
    cell: ({ row }) => row.original.sku || '-',
  },
  { accessorKey: 'brand', header: 'Marca', cell: ({ row }) => row.original.brand || '-' },
  { accessorKey: 'model', header: 'Modelo', cell: ({ row }) => row.original.model || '-' },
  {
    accessorKey: 'categoryId',
    header: 'Categoría',
    cell: ({ row }) => <span>{(row.original as any).categoryName || row.original.categoryId || '-'}</span>,
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
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];

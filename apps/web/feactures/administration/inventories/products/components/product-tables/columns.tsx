'use client';
import { formatCurrency } from '@/lib/formatCurrent';
import { Badge } from '@repo/shadcn/components/ui/badge';
import { cn } from '@repo/shadcn/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { PRODUCT_STATUS_TYPES } from '../../schemas/product-options';
import { Product } from '../../schemas/product.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: 'sku',
    header: 'SKU',
  },
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    accessorKey: 'categoryName',
    header: 'Categoria',
  },
  {
    accessorKey: 'brand',
    header: 'Marca',
  },
  {
    accessorKey: 'model',
    header: 'Modelo',
  },
  {
    accessorKey: 'totalCost',
    header: 'Costo',
    cell: ({ row }) => {
      const totalCost = row.original.totalCost;
      if (totalCost === null) return 0;
      return formatCurrency(Number(totalCost), 'VES');
    },
  },
  {
    accessorKey: 'finalPrice',
    header: 'Precio Max.',
    cell: ({ row }) => {
      const finalPrice = row.original.finalPrice;
      if (finalPrice === null) return 0;
      return formatCurrency(Number(finalPrice), 'VES');
    },
  },
  {
    accessorKey: 'available',
    header: 'Disponibilidad',
    cell: ({ row }) => {
      const available = row.original.available;
      if (available === null) return 0;
      return available;
    },
  },
  {
    accessorKey: 'status',
    header: 'Estatus',
    cell: ({ row }) => {
      const status = row.original.status;
      const statusText =
        PRODUCT_STATUS_TYPES[status as keyof typeof PRODUCT_STATUS_TYPES] ||
        status;

      const variant:
        | 'default'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'success'
        | 'warning' = (() => {
        switch (status) {
          case 'AVAILABLE':
            return 'success';
          case 'DISABLED':
            return 'secondary';
          case 'OUT_OF_STOCK':
            return 'destructive';
          case 'COMMING_SOON':
            return 'warning';
          case 'ON_SALE':
            return 'default';
          default:
            return 'default';
        }
      })();

      return (
        <div className={cn('p-2 h-full w-full')}>
          <Badge
            variant={
              variant as
                | 'default'
                | 'destructive'
                | 'outline'
                | 'secondary'
                | 'success'
                | 'danger'
            }
          >
            {statusText}
          </Badge>
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];

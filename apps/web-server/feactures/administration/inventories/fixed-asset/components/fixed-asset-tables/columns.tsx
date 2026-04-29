'use client';
import { Badge } from '@repo/shadcn/components/ui/badge';
import { cn } from '@repo/shadcn/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { FixedAssetSchemaAPI } from '../../schemas/fixed-asset-api.schema';
import { ESTATUS_TYPES } from '../../schemas/fixed-asset-options';
import { CellAction } from './cell-action';

export const columns: ColumnDef<FixedAssetSchemaAPI>[] = [
  {
    accessorKey: 'assetCode',
    header: 'Código del Activo',
  },
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    accessorKey: 'categoryName',
    header: 'Categoría',
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
    header: 'Precio de Compra',
    cell: ({ row }) => {
      const totalCost = Number(row.original.totalCost).toFixed(2);
      return String(totalCost);
    },
  },
  {
    accessorKey: 'assetStatus',
    header: 'Estatus',
    cell: ({ row }) => {
      const status = row.original.assetStatus;
      const statusText =
        ESTATUS_TYPES[status as keyof typeof ESTATUS_TYPES] || status;

      const variant:
        | 'default'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'success'
        | 'warning' = (() => {
        switch (status) {
          case 'ACTIVE':
            return 'success';
          case 'UNDER_MAINTENANCE':
            return 'secondary';
          case 'INACTIVE':
            return 'warning';
          case 'DEREGISTERED':
            return 'destructive';
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
    cell: ({ row }) => {
      const data = {
        ...row.original,
        acquisitionDate: new Date(row.original.acquisitionDate),
      };
      return <CellAction data={data} />;
    },
  },
];

import { Badge } from '@repo/shadcn/badge';
import type { ColumnDef } from '@tanstack/react-table';
import {
  FIXED_ASSET_STATUS_OPTIONS,
  DEPRECIATION_METHOD_OPTIONS,
} from '../../schemas/inventory-fixed-assets-options';
import type { InventoryFixedAsset } from '../../schemas/inventory-fixed-assets.schema';
import { InventoryFixedAssetsCellAction } from './cell-action';
import { formatCurrency } from '@/lib/format-utils';

const getStatusVariant = (
  status: string,
):
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'success'
  | 'warning' => {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'UNDER_MAINTENANCE':
      return 'warning';
    case 'INACTIVE':
      return 'secondary';
    case 'DEREGISTERED':
      return 'destructive';
    default:
      return 'default';
  }
};

export const inventoryFixedAssetsColumns: ColumnDef<InventoryFixedAsset>[] =
  [
    {
      accessorKey: 'assetCode',
      header: 'Código',
    },
    {
      accessorKey: 'name',
      header: 'Nombre',
    },
    {
      accessorKey: 'categoryName',
      header: 'Categoría',
      cell: ({ row }) => row.original.categoryName || '—',
    },
    {
      accessorKey: 'brand',
      header: 'Marca',
      cell: ({ row }) => row.original.brand || '—',
    },
    {
      accessorKey: 'model',
      header: 'Modelo',
      cell: ({ row }) => row.original.model || '—',
    },
    {
      accessorKey: 'serialNumber',
      header: 'N° Serie',
      cell: ({ row }) => row.original.serialNumber || '—',
    },
    {
      accessorKey: 'assetStatus',
      header: 'Estado',
      cell: ({ row }) => {
        const status = row.original.assetStatus;
        const statusText =
          FIXED_ASSET_STATUS_OPTIONS[
            status as keyof typeof FIXED_ASSET_STATUS_OPTIONS
          ] || status;
        const variant = getStatusVariant(status);

        return (
          <Badge
            variant={
              variant as
                | 'default'
                | 'destructive'
                | 'outline'
                | 'secondary'
                | 'success'
                | 'warning'
            }
          >
            {statusText}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'baseCost',
      header: 'Costo Base',
      cell: ({ row }) => formatCurrency(row.original.baseCost ?? 0, 'VES'),
    },
    {
      accessorKey: 'depreciationMethod',
      header: 'Depreciación',
      cell: ({ row }) => {
        const method = row.original.depreciationMethod;
        return (
          DEPRECIATION_METHOD_OPTIONS[
            method as keyof typeof DEPRECIATION_METHOD_OPTIONS
          ] || method
        );
      },
    },
    {
      accessorKey: 'usefulLifeYears',
      header: 'Vida Útil',
      cell: ({ row }) =>
        `${row.original.usefulLifeYears} año${row.original.usefulLifeYears !== 1 ? 's' : ''}`,
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <InventoryFixedAssetsCellAction data={row.original} />
      ),
    },
  ];

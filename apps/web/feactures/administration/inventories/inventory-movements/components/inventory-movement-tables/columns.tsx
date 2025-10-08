'use client';
import { Badge } from '@repo/shadcn/components/ui/badge';
import { ColumnDef } from '@tanstack/react-table';
import { Minus, Plus, TrendingDown, TrendingUp } from 'lucide-react';
import { MOVEMENT_TYPES } from '../../schemas/inventory-movement-options';
import { InventoryMovement } from '../../schemas/inventory-movement.schema';
import { CellAction } from './cell-action';

const getMovementColor = (type: string) => {
  switch (type) {
    case 'IN':
      return 'bg-green-500 text-black';
    case 'OUT':
      return 'bg-red-400 text-white';
    case 'ADJUST_IN':
      return 'bg-blue-400 text-black';
    case 'ADJUST_OUT':
      return 'bg-yellow-400 text-black';
    default:
      return 'bg-gray-400 text-black';
  }
};

const getMovementIcon = (type: string) => {
  switch (type) {
    case 'IN':
      return <TrendingUp className="h-4 w-4" />;
    case 'OUT':
      return <TrendingDown className="h-4 w-4" />;
    case 'ADJUST_OUT':
      return <Minus className="h-4 w-4" />;
    default:
      return <Plus className="h-4 w-4" />;
  }
};

export const columns: ColumnDef<InventoryMovement>[] = [
  {
    accessorKey: 'movementType',
    header: 'Tipo de Movimiento',
    cell: ({ row }) => {
      const movementTypeKey = row.original
        .movementType as keyof typeof MOVEMENT_TYPES;
      const movementTypeColor = getMovementColor(row.original.movementType);
      const movementIcon = getMovementIcon(row.original.movementType);
      return (
        <Badge className={movementTypeColor}>
          <div className="flex items-center gap-1">
            {movementIcon}
            {MOVEMENT_TYPES[movementTypeKey] || row.original.movementType}
          </div>
        </Badge>
      );
    },
  },
  {
    accessorKey: 'movementDate',
    header: 'Fecha',
  },
  {
    accessorKey: 'itemType',
    header: 'Tipo de Item',
    cell: ({ row }) => {
      const itemType = row.original.itemType;
      return itemType === 'PRODUCT' ? 'Producto' : 'Activo Fijo';
    },
  },
  {
    accessorKey: 'itemName', // New accessorKey for the item's name
    header: 'Nombre del Item',
    cell: ({ row }) => {
      const { itemType, productName, fixedAssetName, fixedAssetCode } =
        row.original;
      if (itemType === 'PRODUCT') {
        return productName;
      } else if (itemType === 'FIXED_ASSET') {
        return `${fixedAssetCode ? fixedAssetCode + ' - ' : ''}${fixedAssetName}`;
      }
      return null;
    },
  },
  {
    accessorKey: 'quantity',
    header: 'Cantidad',
  },
  // {
  //   accessorKey: 'unitCost',
  //   header: 'Costo Unitario',
  // },
  {
    accessorKey: 'description',
    header: 'Descripción',
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];

'use client';
import { ColumnDef } from '@tanstack/react-table';
import { MOVEMENT_TYPES } from '../../schemas/inventory-movement-options';
import { InventoryMovement } from '../../schemas/inventory-movement.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<InventoryMovement>[] = [
  {
    accessorKey: 'productId',
    header: 'ID Producto',
  },
  {
    accessorKey: 'movementType',
    header: 'Tipo de Movimiento',
    cell: ({ row }) => {
      const movementTypeKey = row.original.movementType as keyof typeof MOVEMENT_TYPES;
      return MOVEMENT_TYPES[movementTypeKey] || row.original.movementType;
    },
  },
  {
    accessorKey: 'quantity',
    header: 'Cantidad',
  },
  {
    accessorKey: 'unitCost',
    header: 'Costo Unitario',
  },
  {
    accessorKey: 'documentType',
    header: 'Tipo de Documento',
  },
  {
    accessorKey: 'documentNumber',
    header: 'Número de Documento',
  },
  {
    accessorKey: 'notes',
    header: 'Notas',
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];

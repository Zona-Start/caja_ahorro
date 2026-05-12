import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Badge } from '@repo/shadcn/badge';
import {
  MOVEMENT_TYPE_OPTIONS,
  MOVEMENT_TYPE_BADGE_VARIANT,
  DOCUMENT_TYPE_OPTIONS,
} from '../../schemas/movements-options';
import type { InventoryMovement } from '../../schemas/movements.schema';
import { CellAction } from './cell-action';

export const movementsColumns: ColumnDef<InventoryMovement>[] = [
  {
    accessorKey: 'movementType',
    header: 'Tipo',
    cell: ({ getValue }) => {
      const value = getValue<string>();
      const label =
        MOVEMENT_TYPE_OPTIONS[value as keyof typeof MOVEMENT_TYPE_OPTIONS] ||
        value;
      const variant =
        MOVEMENT_TYPE_BADGE_VARIANT[
          value as keyof typeof MOVEMENT_TYPE_BADGE_VARIANT
        ] || 'default';
      return <Badge variant={variant}>{label}</Badge>;
    },
  },
  {
    accessorKey: 'documentType',
    header: 'Tipo Documento',
    cell: ({ getValue }) => {
      const value = getValue<string>();
      return (
        DOCUMENT_TYPE_OPTIONS[
          value as keyof typeof DOCUMENT_TYPE_OPTIONS
        ] || value
      );
    },
  },
  {
    accessorKey: 'documentNumber',
    header: 'Nro. Documento',
  },
  {
    accessorKey: 'description',
    header: 'Descripción',
  },
  {
    id: 'itemCount',
    header: 'Ítems',
    cell: ({ row }) => {
      const items = row.original.items;
      return items?.length ?? 0;
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Fecha',
    cell: ({ getValue }) => {
      const value = getValue();
      if (!value) return '-';
      try {
        return format(new Date(value as string), 'dd/MM/yyyy HH:mm');
      } catch {
        return '-';
      }
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];

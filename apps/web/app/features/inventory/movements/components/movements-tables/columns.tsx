import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@repo/shadcn/badge';
import {
  MOVEMENT_TYPE_OPTIONS,
  MOVEMENT_TYPE_BADGE_VARIANT,
  MOVEMENT_STATUS_OPTIONS,
  MOVEMENT_STATUS_BADGE_VARIANT,
} from '../../schemas/movements-options';
import type { InventoryMovement } from '../../schemas/movements.schema';
import { MovementsCellAction } from './cell-action';

const mapBadgeVariant = (v: string): 'default' | 'success' | 'destructive' | 'warning' | 'secondary' | 'outline' => {
  const valid = ['default', 'success', 'destructive', 'warning', 'secondary', 'outline'];
  return valid.includes(v) ? (v as 'default' | 'success' | 'destructive' | 'warning' | 'secondary' | 'outline') : 'default';
};

export const movementsColumns: ColumnDef<InventoryMovement>[] = [
  {
    accessorKey: 'movementNumber',
    header: 'Nro.',
    cell: ({ getValue }) => getValue<string>() || '—',
  },
  {
    accessorKey: 'movementType',
    header: 'Tipo',
    cell: ({ getValue }) => {
      const v = getValue<string>();
      return (
        <Badge variant={mapBadgeVariant(MOVEMENT_TYPE_BADGE_VARIANT[v as keyof typeof MOVEMENT_TYPE_BADGE_VARIANT] ?? 'default')}>
          {MOVEMENT_TYPE_OPTIONS[v as keyof typeof MOVEMENT_TYPE_OPTIONS] || v}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ getValue }) => {
      const v = getValue<string>();
      const variant = MOVEMENT_STATUS_BADGE_VARIANT[v] ?? 'default';
      return (
        <Badge variant={variant as 'default' | 'success' | 'destructive'}>
          {MOVEMENT_STATUS_OPTIONS[v] || v}
        </Badge>
      );
    },
  },
  {
    id: 'itemsCount',
    header: 'Ítems',
    cell: ({ row }) => {
      const items = row.original.items;
      return items?.length ?? 0;
    },
  },
  {
    accessorKey: 'movementDate',
    header: 'Fecha',
    cell: ({ getValue }) => {
      const v = getValue();
      if (!v) return '—';
      try {
        const d = v instanceof Date ? v : new Date(v as string);
        return d.toLocaleDateString('es-VE');
      } catch {
        return '—';
      }
    },
  },
  {
    accessorKey: 'description',
    header: 'Descripción',
    cell: ({ getValue }) => {
      const v = getValue<string>();
      return v ? (v.length > 40 ? v.slice(0, 40) + '...' : v) : '—';
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <MovementsCellAction data={row.original} />,
  },
];

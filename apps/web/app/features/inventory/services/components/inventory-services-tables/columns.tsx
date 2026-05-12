import { Badge } from '@repo/shadcn/badge';
import type { ColumnDef } from '@tanstack/react-table';
import { INVENTORY_SERVICE_STATUS_OPTIONS } from '../../schemas/inventory-services-options';
import type { InventoryService } from '../../schemas/inventory-services.schema';
import { InventoryServicesCellAction } from './cell-action';
import { formatCurrency } from '@/lib/format-utils';

export const inventoryServicesColumns: ColumnDef<InventoryService>[] = [
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    accessorKey: 'description',
    header: 'Descripción',
    cell: ({ row }) => row.original.description || '—',
  },
  {
    accessorKey: 'supplierCost',
    header: 'Costo Proveedor',
    cell: ({ row }) => formatCurrency(row.original.supplierCost, 'USD'),
  },
  {
    accessorKey: 'otherCosts',
    header: 'Otros Costos',
    cell: ({ row }) => formatCurrency(row.original.otherCosts, 'USD'),
  },
  {
    accessorKey: 'purchaseTax',
    header: 'Impuesto Compra',
    cell: ({ row }) => formatCurrency(row.original.purchaseTax, 'USD'),
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.original.status;
      const statusText =
        INVENTORY_SERVICE_STATUS_OPTIONS[
          status as keyof typeof INVENTORY_SERVICE_STATUS_OPTIONS
        ] || status;

      const variant = status === 'ACTIVE' ? 'success' : 'destructive';

      return (
        <Badge
          variant={
            variant as
              | 'default'
              | 'destructive'
              | 'outline'
              | 'secondary'
              | 'success'
          }
        >
          {statusText}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => (
      <InventoryServicesCellAction data={row.original} />
    ),
  },
];

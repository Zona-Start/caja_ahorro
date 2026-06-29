import { Badge } from '@repo/shadcn/badge';
import type { ColumnDef } from '@tanstack/react-table';
import { INVENTORY_SERVICE_STATUS_OPTIONS } from '../../schemas/inventory-services-options';
import { InventoryServicesCellAction } from './cell-action';

const CURRENCY_SYMBOLS: Record<string, string> = { VES: 'Bs.', USD: '$', EUR: '€' };

export const inventoryServicesColumns: ColumnDef<any>[] = [
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
    cell: ({ row }) => {
      const sym = CURRENCY_SYMBOLS[row.original.currencyCode] || row.original.currencyCode || '';
      return `${sym} ${Number(row.original.supplierCost || 0).toFixed(2)}`;
    },
  },
  {
    accessorKey: 'otherCosts',
    header: 'Otros Costos',
    cell: ({ row }) => {
      const sym = CURRENCY_SYMBOLS[row.original.currencyCode] || row.original.currencyCode || '';
      return `${sym} ${Number(row.original.otherCosts || 0).toFixed(2)}`;
    },
  },
  {
    accessorKey: 'purchaseTax',
    header: 'Impuesto Compra',
    cell: ({ row }) => {
      const sym = CURRENCY_SYMBOLS[row.original.currencyCode] || row.original.currencyCode || '';
      return `${sym} ${Number(row.original.purchaseTax || 0).toFixed(2)}`;
    },
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

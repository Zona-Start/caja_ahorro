import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@repo/shadcn/badge';
import type { PurchaseOrderApi } from '../../schemas/purchase-orders-api.schema';
import { STATUS_LABELS, STATUS_VARIANTS } from '../../schemas/purchase-orders-options';
import { CellAction } from './cell-action';

function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '-';
  const str = typeof value === 'string' ? value : value.toISOString();
  const [y, m, d] = str.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

export const columns: ColumnDef<PurchaseOrderApi>[] = [
  {
    accessorKey: 'orderNumber',
    header: 'N° Orden',
    cell: ({ row }) => <span className="font-medium">{row.original.orderNumber}</span>,
  },
  {
    accessorKey: 'supplierName',
    header: 'Proveedor',
    cell: ({ row }) => row.original.supplierName || row.original.supplierId || '-',
  },
  {
    accessorKey: 'orderDate',
    header: 'Fecha',
    cell: ({ row }) => formatDate(row.original.orderDate),
  },
  {
    accessorKey: 'subtotal',
    header: 'Subtotal',
    cell: ({ row }) => `Bs. ${Number(row.original.subtotal).toFixed(2)}`,
  },
  {
    accessorKey: 'taxAmount',
    header: 'Impuesto',
    cell: ({ row }) => `Bs. ${Number(row.original.taxAmount || 0).toFixed(2)}`,
  },
  {
    accessorKey: 'totalAmount',
    header: 'Total',
    cell: ({ row }) => <span className="font-semibold">Bs. {Number(row.original.totalAmount).toFixed(2)}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => (
      <Badge variant={STATUS_VARIANTS[row.original.status] || 'secondary'}>
        {STATUS_LABELS[row.original.status] || row.original.status}
      </Badge>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];

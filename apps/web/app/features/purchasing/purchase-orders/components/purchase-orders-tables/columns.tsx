import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@repo/shadcn/badge';
import { format } from 'date-fns';
import type { PurchaseOrderApi } from '../../schemas/purchase-orders-api.schema';
import { STATUS_LABELS, STATUS_VARIANTS } from '../../schemas/purchase-orders-options';
import { CellAction } from './cell-action';

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
    cell: ({ row }) => {
      const d = row.original.orderDate;
      return d ? format(new Date(d), 'dd/MM/yyyy') : '-';
    },
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

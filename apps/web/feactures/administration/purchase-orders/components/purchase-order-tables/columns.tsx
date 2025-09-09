'use client';

import { Badge } from '@repo/shadcn/components/ui/badge';
import { ColumnDef } from '@tanstack/react-table';
import { ESTATUS_TYPES } from '../../schemas/purchase-order-options';
import { PurchaseOrder } from '../../schemas/purchase-order.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<PurchaseOrder>[] = [
  {
    accessorKey: 'orderNumber',
    header: 'Número de Orden',
  },
  {
    accessorKey: 'supplierName',
    header: 'Proveedor',
  },
  {
    accessorKey: 'orderDate',
    header: 'Fecha de Orden',
    cell: ({ row }) => {
      const date = new Date(row.original.orderDate);
      return date.toLocaleDateString();
    },
  },
  {
    accessorKey: 'itemsCount',
    header: 'Items',
    cell: ({ row }) => {
      const item = row.original.itemsCount;
      return `${item} items` || row.original.itemsCount;
    },
  },
  {
    accessorKey: 'totalAmount',
    header: 'Total',
  },
  {
    accessorKey: 'status',
    header: 'Estatus',
    cell: ({ row }) => {
      const status = row.original.status;
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
          case 'DRAFT':
            return 'default';
          case 'PENDING':
            return 'secondary';
          case 'RECEIVED':
            return 'warning';
          case 'INVOICED':
            return 'success';
          case 'CANCELLED':
            return 'outline';
          case 'CLOSED':
          default:
            return 'destructive';
        }
      })();

      return (
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
      );
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => {
      const newItems = row.original.items.map((item) => ({
        ...item,
        lineType: item.lineType.toString(),
        totalCost: item.totalCost ?? 0,
      }));

      const newData = {
        ...row.original,
        orderDate: row.original.orderDate
          ? new Date(row.original.orderDate).toLocaleDateString()
          : '',
        expectedDeliveryDate: row.original.expectedDeliveryDate
          ? new Date(row.original.expectedDeliveryDate).toLocaleDateString()
          : '',
        items: newItems,
      };

      return <CellAction data={row.original} dataDetails={newData} />;
    },
  },
];

'use client';

import { formatCurrency } from '@/lib/formatCurrent';
import { Checkbox } from '@repo/shadcn/components/ui/checkbox';
import { ColumnDef } from '@tanstack/react-table';
import { z } from 'zod';
import { linkableItemApiSchema } from '../../schemas/bank-movement-api.schema';

export type LinkableItemColumn = z.infer<typeof linkableItemApiSchema>;

export const columns: ColumnDef<LinkableItemColumn>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'concept',
    header: 'Concepto',
  },
  {
    accessorKey: 'date',
    header: 'Fecha',
    cell: ({ row }) => new Date(row.original.date!).toLocaleDateString(),
  },
  {
    accessorKey: 'amount',
    header: 'Monto',
    cell: ({ row }) => formatCurrency(Number(row.original.amount), 'VES'),
  },
];

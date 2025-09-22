'use client';

import { cn } from '@repo/shadcn/lib/utils';
import { ColumnDef } from '@tanstack/react-table';

import { Badge } from '@repo/shadcn/components/ui/badge';
import {
  ESTATUS_TYPES,
  SUPPLIER_CATEGORY_TYPES,
} from '../../schemas/suppliers-options';
import { Supplier } from '../../schemas/suppliers.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Supplier>[] = [
  {
    accessorKey: 'code',
    header: 'Código',
  },
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    accessorKey: 'taxId',
    header: 'Rif',
  },
  {
    accessorKey: 'contactName',
    header: 'Contacto',
  },
  {
    accessorKey: 'category',
    header: 'Categoria',
    cell: ({ row }) => {
      const categoryKey = row.original
        .category as keyof typeof SUPPLIER_CATEGORY_TYPES;

      const categoryValue = SUPPLIER_CATEGORY_TYPES[categoryKey];

      if (categoryValue) {
        const formattedCategory =
          categoryValue.charAt(0).toUpperCase() +
          categoryValue.slice(1).toLowerCase();
        return formattedCategory;
      }

      return categoryValue;
    },
  },
  {
    accessorKey: 'status',
    header: 'Estatus',
    cell: ({ row }) => {
      const statusKey = row.original.status as keyof typeof ESTATUS_TYPES;
      const statusText = ESTATUS_TYPES[statusKey] || statusKey;

      let variant:
        | 'default'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'success'
        | 'warning';

      switch (statusText) {
        case 'ACTIVO':
          variant = 'success';
          break;
        case 'INACTIVO':
          variant = 'destructive';
          break;
        case 'SUSPENDIDO':
          variant = 'warning';
          break;
        default:
          variant = 'default';
          break;
      }

      // Format the text after determining the variant
      const formattedStatus = statusText
        ? statusText.charAt(0).toUpperCase() + statusText.slice(1).toLowerCase()
        : '';

      return (
        <div className={cn('p-2 h-full w-full')}>
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
            {formattedStatus}
          </Badge>
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];

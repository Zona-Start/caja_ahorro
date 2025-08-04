'use client';
import { ColumnDef } from '@tanstack/react-table';
import { SERVICE_STATUS_TYPES } from '../../schemas/service-options';
import { Service } from '../../schemas/service.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Service>[] = [
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    accessorKey: 'description',
    header: 'Descripción',
  },
  {
    accessorKey: 'categoryName',
    header: 'Categoria',
  },
  {
    accessorKey: 'status',
    header: 'Estatus',
    cell: ({ row }) => {
      const statusKey = row.original
        .status as keyof typeof SERVICE_STATUS_TYPES;
      return SERVICE_STATUS_TYPES[statusKey] || row.original.status;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];

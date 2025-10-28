'use client';

import { ColumnDef } from '@tanstack/react-table';
import { AccountingConfiguration } from '../../schemas/accounting-configuration.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<AccountingConfiguration>[] = [
  {
    accessorKey: 'operationType',
    header: 'Tipo de Operación',
  },
  {
    accessorKey: 'descriptionTemplate',
    header: 'Plantilla de Descripción',
  },
  {
    accessorKey: 'isActive',
    header: 'Activo',
    cell: ({ row }) => (row.original.isActive ? 'Sí' : 'No'),
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];

'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ESTATUS_TYPES } from '../../schemas/associates-options';
import { AssociatesMutate } from '../../schemas/associates.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<AssociatesMutate>[] = [
  {
    accessorKey: 'nationality',
    header: 'Nacionalidad',
  },
  {
    accessorKey: 'cedula',
    header: 'Cédula',
  },
  {
    accessorKey: 'fullname',
    header: 'Nombre y Apellido',
  },
  {
    accessorKey: 'status',
    header: 'Estatus',
    cell: ({ row }) => {
      const label = ESTATUS_TYPES[row.original.status] || row.original.status;
      const colorClass =
        row.original.status === 'ACTIVE' ? 'text-green-500' : 'text-red-500';
      return <span className={colorClass}>{label}</span>;
    },
  },
  {
    accessorKey: 'isPayrollCredit',
    header: 'Credi-Nomina',
    cell: ({ row }) => {
      if (row.original.isPayrollCredit === true) {
        return <span className="text-red-500">SI</span>;
      } else {
        return <span>No</span>;
      }
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];

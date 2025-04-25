'use client';

import { ColumnDef } from '@tanstack/react-table';
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
      if (row.original.status === 'ACTIVE') {
        return <span className="text-green-500">Activo</span>;
      } else {
        return <span className="text-red-500">Inactivo</span>;
      }
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

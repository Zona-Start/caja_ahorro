'use client';

import { ColumnDef } from '@tanstack/react-table';
import { SettlementPaymentApi } from '../../schemas/settlement-api-response';
import { CellAction } from './cell-action';

export const columns: ColumnDef<SettlementPaymentApi>[] = [
  {
    accessorKey: 'customReference',
    header: 'Referencia',
  },
   {
    accessorKey: 'associateCedula',
    header: 'Cédula Asociado',
  },
  {
    accessorKey: 'associateFullname',
    header: 'Nombre y apellido asociado',
  },
  {
    accessorKey: 'netLiquidationAmount',
    header: 'Monto Liquidado',
  },
  {
    accessorKey: 'liquidationDate',
    header: 'Fecha Liquidación',
  },

  {
    accessorKey: 'totalSavingsBalanceAtLiquidation',
    header: 'Haberes Totales',
  },
  {
    accessorKey: 'totalOutstandingLoansAtLiquidation',
    header: 'Préstamos Pendientes',
  },
  {
    accessorKey: 'totalOutstandingCreditsAtLiquidation',
    header: 'Créditos Pendientes',
  },
  
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];

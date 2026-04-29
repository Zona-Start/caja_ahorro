'use client';

import { formatCurrency } from '@/lib/formatCurrent';
import { Badge } from '@repo/shadcn/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/tooltip';
import { ColumnDef } from '@tanstack/react-table';
import { HelpCircle } from 'lucide-react';
import { BankAccount } from '../../schemas/bank-account.schema';
import { CellAction } from './cell-action';

const DifferenceCell = ({ row }: { row: any }) => {
  const bookBalance = row.original.currentBalance ?? 0;
  const bankBalance = row.original.lastStatementBalance ?? 0;
  const difference = bankBalance - bookBalance;

  const getDifferenceColor = () => {
    if (difference === 0) return 'text-green-600';
    if (bookBalance === 0) return 'text-gray-500'; // No hay base para comparar

    const percentageDiff = Math.abs((difference / bookBalance) * 100);

    if (percentageDiff > 1) return 'text-red-600';
    return 'text-orange-500';
  };

  return (
    <span className={`font-medium ${getDifferenceColor()}`}>
      {formatCurrency(difference, row.original.currencyCode)}
    </span>
  );
};

export const columns: ColumnDef<BankAccount>[] = [
  {
    accessorKey: 'bankDirectoryName',
    header: 'Banco',
  },
  {
    accessorKey: 'accountNumber',
    header: 'Número Cuenta',
  },
  {
    accessorKey: 'accountName',
    header: 'Nombre',
  },
  {
    accessorKey: 'accountType',
    header: 'Tipo',
    cell: ({ row }) => {
      if (row.original.accountType === 'CURRENT') {
        return <span>Corriente</span>;
      } else {
        return <span>Ahorro</span>;
      }
    },
  },
  {
    accessorKey: 'currencyCode',
    header: 'Moneda',
  },
  {
    accessorKey: 'currentBalance',
    header: () => (
      <div className="flex items-center gap-1">
        Saldo según libros
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p>
                Suma de todos los asientos contables que afectan esta cuenta.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    ),
    cell: ({ row }) => {
      const balance = row.original.currentBalance;
      if (!balance) {
        return <span className="text-muted-foreground">—</span>;
      }
      return <span>{formatCurrency(balance, 'VES')}</span>;
    },
  },
  // {
  //   accessorKey: 'lastStatementBalance',
  //   header: () => (
  //     <div className="flex items-center gap-1">
  //       Saldo extracto
  //       <TooltipProvider>
  //         <Tooltip>
  //           <TooltipTrigger asChild>
  //             <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
  //           </TooltipTrigger>
  //           <TooltipContent>
  //             <p>Último valor reportado por el banco.</p>
  //           </TooltipContent>
  //         </Tooltip>
  //       </TooltipProvider>
  //     </div>
  //   ),
  //   cell: ({ row }) => {
  //     const balance = row.original.lastStatementBalance;
  //     if (!balance) {
  //       return <span className="text-muted-foreground">—</span>;
  //     }
  //     return <span>{formatCurrency(balance, 'VES')}</span>;
  //   },
  // },
  {
    id: 'difference',
    header: 'Diferencia',
    cell: DifferenceCell,
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      return (
        <Badge variant={row.original.isActive ? 'success' : 'danger'}>
          {row.original.isActive ? 'Activa' : 'Inactiva'}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];

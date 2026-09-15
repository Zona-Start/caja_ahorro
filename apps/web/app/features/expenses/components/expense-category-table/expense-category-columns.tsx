import { Badge } from '@repo/shadcn/badge';
import type { ColumnDef } from '@tanstack/react-table';
import type { ExpenseCategory } from '../../schemas/expense-categories.schema';
import { ExpenseCategoryCellActions } from './expense-category-cell-actions';

export const expenseCategoryColumns: ColumnDef<ExpenseCategory>[] = [
  {
    accessorKey: 'name',
    header: 'Categoría',
  },
  {
    id: 'accountingAccount',
    header: 'Cuenta Contable',
    cell: ({ row }) =>
      row.original.accountingAccountId ? (
        <Badge variant="outline">Vinculada</Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
  },
  {
    accessorKey: 'isActive',
    header: 'Estado',
    cell: ({ getValue }) => (
      <Badge variant={getValue<boolean>() ? 'success' : 'destructive'}>
        {getValue<boolean>() ? 'Activa' : 'Inactiva'}
      </Badge>
    ),
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <ExpenseCategoryCellActions data={row.original} />,
  },
];

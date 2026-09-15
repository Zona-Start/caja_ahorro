import { AlertModal } from '@/components/shared/alert-modal';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@repo/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/shadcn/dropdown-menu';
import { Edit, MoreHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useDeleteExpenseCategoryMutation } from '../../hooks/use-expense-categories-query';
import type { ExpenseCategory } from '../../schemas/expense-categories.schema';
import { ExpenseCategoryModal } from '../expense-category-modal';

interface ExpenseCategoryCellActionsProps {
  data: ExpenseCategory;
}

export function ExpenseCategoryCellActions({
  data,
}: ExpenseCategoryCellActionsProps) {
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const deleteMutation = useDeleteExpenseCategoryMutation();
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const onDeleteConfirm = () => {
    deleteMutation.mutate(data.id, {
      onSuccess: () => setOpenDelete(false),
    });
  };

  return (
    <>
      <AlertModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={onDeleteConfirm}
        loading={deleteMutation.isPending}
        title="¿Desactivar esta categoría de gasto?"
        description="La categoría quedará inactiva y no podrá usarse en nuevos gastos."
      />

      <ExpenseCategoryModal
        open={openEdit}
        onOpenChange={setOpenEdit}
        mode="edit"
        defaultValues={{
          id: data.id,
          name: data.name,
          accountingAccountId: data.accountingAccountId ?? undefined,
          isActive: data.isActive,
        }}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {hasPermission('treasury:expense-categories', 'update') && (
            <DropdownMenuItem onClick={() => setOpenEdit(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
          )}
          {hasPermission('treasury:expense-categories', 'delete') && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setOpenDelete(true)}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Desactivar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

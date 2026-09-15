import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import type { ExpenseCategoryMutation } from '../schemas/expense-categories.schema';
import { ExpenseCategoryForm } from './expense-category-form';

interface ExpenseCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<ExpenseCategoryMutation>;
  mode?: 'create' | 'edit';
}

export function ExpenseCategoryModal({
  open,
  onOpenChange,
  defaultValues,
  mode = 'create',
}: ExpenseCategoryModalProps) {
  const isEditMode = mode === 'edit' && !!defaultValues?.id;

  const handleSuccess = () => onOpenChange(false);
  const handleCancel = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode
              ? 'Editar Categoría de Gasto'
              : 'Nueva Categoría de Gasto'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Actualiza la información de la categoría de gasto.'
              : 'Registra una categoría para clasificar los gastos del tenant.'}
          </DialogDescription>
        </DialogHeader>
        <ExpenseCategoryForm
          key={defaultValues?.id ?? 'new'}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
        />
      </DialogContent>
    </Dialog>
  );
}

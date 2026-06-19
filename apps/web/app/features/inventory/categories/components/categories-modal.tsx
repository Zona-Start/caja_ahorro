import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import type { Category, CategoryMutation } from '../schemas/categories.schema';
import { CategoriesForm } from './categories-form';

interface CategoriesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Category;
  mode?: 'create' | 'edit' | 'view';
}

function toFormValues(data?: Category): Partial<CategoryMutation> {
  if (!data) return {};
  return {
    id: data.id,
    name: data.name,
    group: data.group,
    description: data.description ?? undefined,
    tenantId: data.tenantId,
  };
}

export function CategoriesModal({
  open,
  onOpenChange,
  defaultValues,
  mode = 'create',
}: CategoriesModalProps) {
  const formValues = useMemo(() => toFormValues(defaultValues), [defaultValues]);

  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isViewMode
              ? 'Detalles de la Categoría'
              : isEditMode
                ? 'Editar Categoría'
                : 'Nueva Categoría'}
          </DialogTitle>
          <DialogDescription>
            {isViewMode
              ? 'Información completa de la categoría.'
              : isEditMode
                ? 'Actualiza la información de la categoría.'
                : 'Crea una nueva categoría de inventario.'}
          </DialogDescription>
        </DialogHeader>
        <CategoriesForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={formValues}
          disabled={isViewMode}
        />
      </DialogContent>
    </Dialog>
  );
}

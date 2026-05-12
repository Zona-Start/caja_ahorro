import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { type CategoryMutation } from '../schemas/categories.schema';
import { CategoriesForm } from './categories-form';

interface CategoriesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<CategoryMutation>;
  mode?: 'create' | 'edit' | 'view';
}

export function CategoriesModal({
  open,
  onOpenChange,
  defaultValues,
  mode = 'create',
}: CategoriesModalProps) {
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isViewMode
              ? 'Detalles de Categoría'
              : isEditMode
                ? 'Editar Categoría'
                : 'Crear Categoría'}
          </DialogTitle>
          <DialogDescription>
            {isViewMode
              ? 'Información de la categoría.'
              : defaultValues?.id
                ? 'Actualiza la información de la categoría.'
                : 'Complete los campos para crear una nueva categoría.'}
          </DialogDescription>
        </DialogHeader>
        <CategoriesForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          disabled={isViewMode}
        />
      </DialogContent>
    </Dialog>
  );
}
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import type { UserMutation } from '../schemas/users.schema';
import { UsersForm } from './users-form';

interface UsersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<UserMutation>;
  mode?: 'create' | 'edit' | 'view';
}

export function UsersModal({
  open,
  onOpenChange,
  defaultValues,
  mode = 'create',
}: UsersModalProps) {
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isViewMode
              ? 'Detalles del Usuario'
              : isEditMode
                ? 'Editar Usuario'
                : 'Nuevo Usuario'}
          </DialogTitle>
          <DialogDescription>
            {isViewMode
              ? 'Información completa del usuario.'
              : isEditMode
                ? 'Actualiza la información del usuario.'
                : 'Crea un nuevo usuario para el sistema.'}
          </DialogDescription>
        </DialogHeader>
        <UsersForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          disabled={isViewMode}
        />
      </DialogContent>
    </Dialog>
  );
}
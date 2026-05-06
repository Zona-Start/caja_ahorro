import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import type { PermissionMutation } from '../schemas/permissions.schema';
import { PermissionsForm } from './permissions-form';

interface PermissionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<PermissionMutation>;
  mode?: 'create' | 'edit' | 'view';
}

export function PermissionsModal({
  open,
  onOpenChange,
  defaultValues,
  mode = 'create',
}: PermissionsModalProps) {
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
              ? 'Detalles del Permiso'
              : isEditMode
                ? 'Editar Permiso'
                : 'Nuevo Permiso'}
          </DialogTitle>
          <DialogDescription>
            {isViewMode
              ? 'Información completa del permiso.'
              : isEditMode
                ? 'Actualiza la información del permiso.'
                : 'Crea un nuevo permiso para el sistema.'}
          </DialogDescription>
        </DialogHeader>
        <PermissionsForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          disabled={isViewMode}
        />
      </DialogContent>
    </Dialog>
  );
}
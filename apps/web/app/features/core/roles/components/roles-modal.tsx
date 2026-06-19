import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import type { Role, RoleMutation } from '../schemas/roles.schema';
import { RolesForm } from './roles-form';

interface RolesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<Role>;
  mode?: 'create' | 'edit' | 'view';
}

export function RolesModal({
  open,
  onOpenChange,
  defaultValues,
  mode = 'create',
}: RolesModalProps) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';

  const transformedValues = useMemo<Partial<RoleMutation>>(() => {
    if (!defaultValues) return {};

    const permissionIds = defaultValues.rolePermissions?.map(
      (rp) => rp.permission.id,
    ) || [];

    return {
      id: defaultValues.id,
      tenantId: defaultValues.tenantId,
      name: defaultValues.name,
      description: defaultValues.description || '',
      isDefault: defaultValues.isDefault,
      permissionIds,
    };
  }, [defaultValues]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isViewMode
              ? 'Detalles del Rol'
              : isEditMode
                ? 'Editar Rol'
                : 'Nuevo Rol'}
          </DialogTitle>
          <DialogDescription>
            {isViewMode
              ? 'Información completa del rol y sus permisos.'
              : isEditMode
                ? 'Actualiza la información del rol y sus permisos.'
                : 'Crea un nuevo rol para el sistema.'}
          </DialogDescription>
        </DialogHeader>
        <RolesForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={transformedValues}
          disabled={isViewMode}
        />
      </DialogContent>
    </Dialog>
  );
}
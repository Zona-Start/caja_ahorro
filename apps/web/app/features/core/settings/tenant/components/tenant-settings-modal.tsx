import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import type { TenantSettingMutation } from '../schemas/tenant-settings.schema';
import { TenantSettingsForm } from './tenant-settings-form';

interface TenantSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<TenantSettingMutation>;
  mode?: 'create' | 'edit' | 'view';
}

export function TenantSettingsModal({
  open,
  onOpenChange,
  defaultValues,
  mode = 'edit',
}: TenantSettingsModalProps) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const isCreateMode = mode === 'create';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isViewMode
              ? 'Detalles del Parámetro'
              : isCreateMode
                ? 'Nuevo Parámetro'
                : 'Editar Parámetro'}
          </DialogTitle>
          <DialogDescription>
            {isViewMode
              ? 'Información del parámetro.'
              : isCreateMode
                ? 'Crea un nuevo parámetro de configuración.'
                : 'Actualiza el valor del parámetro.'}
          </DialogDescription>
        </DialogHeader>
        <TenantSettingsForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          disabled={isViewMode}
          mode={isCreateMode ? 'create' : 'edit'}
        />
      </DialogContent>
    </Dialog>
  );
}

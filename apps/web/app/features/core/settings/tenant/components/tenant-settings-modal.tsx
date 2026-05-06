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
  mode?: 'edit' | 'view';
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isViewMode ? 'Detalles del Parámetro' : 'Editar Parámetro'}
          </DialogTitle>
          <DialogDescription>
            {isViewMode
              ? 'Información del parámetro.'
              : 'Actualiza el valor del parámetro.'}
          </DialogDescription>
        </DialogHeader>
        <TenantSettingsForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          disabled={isViewMode}
        />
      </DialogContent>
    </Dialog>
  );
}
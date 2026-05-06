import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import type { GlobalSettingMutation } from '../schemas/global-settings.schema';
import { GlobalSettingsForm } from './global-settings-form';

interface GlobalSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<GlobalSettingMutation>;
  mode?: 'create' | 'edit' | 'view';
}

export function GlobalSettingsModal({
  open,
  onOpenChange,
  defaultValues,
  mode = 'create',
}: GlobalSettingsModalProps) {
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
              ? 'Detalles del Parámetro'
              : isEditMode
                ? 'Editar Parámetro'
                : 'Nuevo Parámetro'}
          </DialogTitle>
          <DialogDescription>
            {isViewMode
              ? 'Información completa del parámetro.'
              : isEditMode
                ? 'Actualiza la información del parámetro.'
                : 'Crea un nuevo parámetro global del sistema.'}
          </DialogDescription>
        </DialogHeader>
        <GlobalSettingsForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          disabled={isViewMode}
        />
      </DialogContent>
    </Dialog>
  );
}
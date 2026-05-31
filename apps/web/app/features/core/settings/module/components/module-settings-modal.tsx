import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import type { ModuleSettingMutation } from '../schemas/module-settings.schema';
import { ModuleSettingsForm } from './module-settings-form';

interface ModuleSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<ModuleSettingMutation>;
  mode?: 'create' | 'edit' | 'view';
}

export function ModuleSettingsModal({
  open,
  onOpenChange,
  defaultValues,
  mode = 'create',
}: ModuleSettingsModalProps) {
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
                : 'Crea un nuevo parámetro por módulo.'}
          </DialogDescription>
        </DialogHeader>
        <ModuleSettingsForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          disabled={isViewMode}
          mode={mode}
        />
      </DialogContent>
    </Dialog>
  );
}
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { CategoryTypes } from '../schemas/category-types-schemas';
import { GROUP_TYPES } from '../schemas/group-options';
import { CategoriesTypesForm } from './categories-types-form';

interface CategoriesTypesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<CategoryTypes>;
  group: string;
}

export function CategoriesTypesModal({
  open,
  onOpenChange,
  defaultValues,
  group,
}: CategoriesTypesModalProps) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  let name;
  if (group === GROUP_TYPES.TIPOS_ASOCIADOS) {
    name = 'Tipo Asociado';
  } else if (group === GROUP_TYPES.TIPO_FRECUENCIA) {
    name = 'Tipo Frecuencia';
  } else if (group === GROUP_TYPES.TIPO_TRABAJADOR) {
    name = 'Tipo Trabajador';
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          onOpenChange(false);
        }
      }}
    >
      <DialogContent className="sm:max-w-[600px] z-50 backdrop-blur-lg bg-background/80">
        <DialogHeader>
          <DialogTitle>
            {defaultValues?.id ? `Actualizar ${name}` : `Crear ${name}`}
          </DialogTitle>
          <DialogDescription>Complete los campos.</DialogDescription>
        </DialogHeader>
        <CategoriesTypesForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          group={group}
        />
      </DialogContent>
    </Dialog>
  );
}

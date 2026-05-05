import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { type WithdrawalTypes } from '../schemas/withdrawal-types.schema';
import { WithdrawalTypesForm } from './withdrawal-types-form';

interface WithdrawalTypesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<WithdrawalTypes>;
  readOnly?: boolean;
}

export function WithdrawalTypesModal({
  open,
  onOpenChange,
  defaultValues,
  readOnly = false,
}: WithdrawalTypesModalProps) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {defaultValues?.id ? 'Editar Tipo de Retiro' : 'Crear Tipo de Retiro'}
          </DialogTitle>
          <DialogDescription>
            Complete los campos para {defaultValues?.id ? 'actualizar' : 'crear'} el tipo de retiro
          </DialogDescription>
        </DialogHeader>
        <WithdrawalTypesForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          readOnly={readOnly}
        />
      </DialogContent>
    </Dialog>
  );
}

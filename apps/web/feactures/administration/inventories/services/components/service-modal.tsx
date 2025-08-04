import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Service } from '../schemas/service.schema';
import ServiceForm from './service-form';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<Service>;
  readOnly?: boolean;
}

export default function ServiceModal({
  open,
  onOpenChange,
  defaultValues,
  readOnly = false,
}: Props) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          onOpenChange(false);
        }
      }}
    >
      <DialogContent className="sm:max-w-[800px] z-50 backdrop-blur-lg bg-background/80">
        <DialogHeader>
          <DialogTitle>
            {defaultValues ? 'Editar servicio' : 'Nuevo servicio'}
          </DialogTitle>
          <DialogDescription>
            Complete los campos para{' '}
            {defaultValues?.id ? 'actualizar' : 'crear'} el servicio
          </DialogDescription>
        </DialogHeader>
        <ServiceForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          readOnly={readOnly}
        />
      </DialogContent>
    </Dialog>
  );
}

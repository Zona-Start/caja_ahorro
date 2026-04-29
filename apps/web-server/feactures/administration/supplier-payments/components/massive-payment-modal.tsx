
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/components/ui/dialog';
import { MassivePaymentForm } from './massive-payment-form';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MassivePaymentModal({
  open,
  onOpenChange,
}: ModalProps) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1200px]">
        <DialogHeader>
          <DialogTitle>Pagos Masivos a Proveedores</DialogTitle>
        </DialogHeader>
        <MassivePaymentForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </DialogContent>
    </Dialog>
  );
}

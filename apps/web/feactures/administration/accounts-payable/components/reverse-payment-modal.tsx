
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/components/ui/dialog';
import { ReversePaymentForm } from './reverse-payment-form';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReversePaymentModal({ open, onOpenChange }: ModalProps) {
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
          <DialogTitle>Reversar Pagos a Proveedores</DialogTitle>
        </DialogHeader>
        <ReversePaymentForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </DialogContent>
    </Dialog>
  );
}

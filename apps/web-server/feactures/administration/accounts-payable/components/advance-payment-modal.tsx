import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/components/ui/dialog';
import { AdvancePaymentForm } from './advance-payment-form';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdvancePaymentModal({
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
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Registrar Anticipo a Proveedor</DialogTitle>
        </DialogHeader>
        <AdvancePaymentForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </DialogContent>
    </Dialog>
  );
}

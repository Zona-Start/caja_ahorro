import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { useSupplierPaymentsModalStore } from '../store/supplier-payments-modal.store';
import { SupplierPaymentsForm } from './supplier-payments-form';

export function SupplierPaymentsModal() {
  const { isOpen, mode, closeModal } = useSupplierPaymentsModalStore();

  const handleSuccess = () => {
    closeModal();
  };

  const handleCancel = () => {
    closeModal();
  };

  const isPayMode = mode === 'pay';
  const isAdvanceMode = mode === 'payAdvance';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isAdvanceMode ? 'Registrar Anticipo' : 'Registrar Pago a Proveedor'}
          </DialogTitle>
          <DialogDescription>
            {isAdvanceMode
              ? 'Registra un anticipo al proveedor.'
              : 'Registra un nuevo pago a proveedor.'}
          </DialogDescription>
        </DialogHeader>
        <SupplierPaymentsForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          disabled={false}
        />
      </DialogContent>
    </Dialog>
  );
}

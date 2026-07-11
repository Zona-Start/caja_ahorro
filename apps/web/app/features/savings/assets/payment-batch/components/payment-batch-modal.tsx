import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { PaymentBatchForm } from './payment-batch-form';
import { usePaymentBatchModalStore } from '../store/payment-batch-store';

export function PaymentBatchModal() {
  const { isCreateOpen, closeCreateModal } = usePaymentBatchModalStore();

  return (
    <Dialog open={isCreateOpen} onOpenChange={(open) => { if (!open) closeCreateModal(); }}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Nuevo Lote de Pago</DialogTitle>
          <DialogDescription>
            Seleccione los registros aprobados y pendientes por desembolsar.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          <PaymentBatchForm onCancel={closeCreateModal} onSuccess={closeCreateModal} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

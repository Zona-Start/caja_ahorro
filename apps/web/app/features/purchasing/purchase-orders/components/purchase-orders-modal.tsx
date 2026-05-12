import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { usePurchaseOrdersModalStore } from '../store/purchase-orders-modal.store';
import { PurchaseOrdersForm } from './purchase-orders-form';

export function PurchaseOrdersModal() {
  const { isOpen, mode, data, closeModal } = usePurchaseOrdersModalStore();

  const readOnly = mode === 'view';

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeModal();
      }}
    >
      <DialogContent className="sm:max-w-[900px] z-50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {readOnly
              ? 'Ver Orden de Compra'
              : data?.id
                ? 'Actualizar Orden de Compra'
                : 'Crear Orden de Compra'}
          </DialogTitle>
          <DialogDescription>
            {readOnly
              ? 'Detalles de la orden de compra seleccionada.'
              : `Complete la información para ${data?.id ? 'actualizar' : 'crear'} la orden de compra.`}
          </DialogDescription>
        </DialogHeader>
        <PurchaseOrdersForm
          onSuccess={closeModal}
          onCancel={closeModal}
          defaultValues={data}
          readOnly={readOnly}
        />
      </DialogContent>
    </Dialog>
  );
}

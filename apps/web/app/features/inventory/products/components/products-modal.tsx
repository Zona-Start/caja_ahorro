import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { useProductsModalStore } from '../store/products-modal.store';
import { ProductsForm } from './products-form';

export function ProductsModal() {
  const { isOpen, mode, data, closeModal } = useProductsModalStore();

  const readOnly = mode === 'view';

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeModal();
      }}
    >
      <DialogContent className="sm:max-w-[800px] z-50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {readOnly
              ? 'Ver Producto'
              : data?.id
                ? 'Actualizar Producto'
                : 'Crear Producto'}
          </DialogTitle>
          <DialogDescription>
            {readOnly
              ? 'Detalles del producto seleccionado.'
              : `Complete la información para ${data?.id ? 'actualizar' : 'crear'} el producto.`}
          </DialogDescription>
        </DialogHeader>
        <ProductsForm
          onSuccess={closeModal}
          onCancel={closeModal}
          defaultValues={data}
          readOnly={readOnly}
        />
      </DialogContent>
    </Dialog>
  );
}

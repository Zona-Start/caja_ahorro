import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { QUERY_KEYS } from '@/lib/query-keys';
import { ProductsService } from '../services/products-service';
import { useProductsModalStore } from '../store/products-modal.store';
import { ProductsForm } from './products-form';
import { ProductsViewModal } from './products-view-modal';

export function ProductsModal() {
  const { isOpen, mode, data, closeModal } = useProductsModalStore();

  const { data: fullProduct, isLoading: isLoadingProduct } = useQuery({
    queryKey: QUERY_KEYS.products.detail(data?.id!),
    queryFn: () => ProductsService.getById(data?.id!),
    enabled: (mode === 'view' || mode === 'edit') && !!data?.id && isOpen,
  });

  if (mode === 'view') {
    return (
      <ProductsViewModal
        open={isOpen}
        onOpenChange={(open) => { if (!open) closeModal(); }}
        productId={data?.id}
      />
    );
  }

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
            {data?.id ? 'Actualizar Producto' : 'Crear Producto'}
          </DialogTitle>
          <DialogDescription>
            Complete la información para {data?.id ? 'actualizar' : 'crear'} el producto.
          </DialogDescription>
        </DialogHeader>
        {mode === 'edit' && isLoadingProduct ? (
          <div className="flex justify-center py-8 text-sm text-muted-foreground">
            Cargando información del producto...
          </div>
        ) : (
          <ProductsForm
            onSuccess={closeModal}
            onCancel={closeModal}
            defaultValues={mode === 'edit' ? fullProduct : data}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

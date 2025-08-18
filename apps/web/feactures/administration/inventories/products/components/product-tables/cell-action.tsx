'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@repo/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/tooltip';

import { Edit, Loader2, Trash } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useProductById } from '../../hooks';
import { useDeleteProduct } from '../../hooks/use-mutation-product';
import { Product } from '../../schemas/product.schema';
import ProductModal from '../product-modal';

interface CellActionProps {
  data: Product;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [mode, setMode] = useState(false);
  const [productData, setProductData] = useState<Product | null>(null);
  const [productIdToFetch, setProductIdToFetch] = useState<number | null>(null);

  const { mutate: deleteProduct } = useDeleteProduct();

  const { data: fetchedProductData, isFetching: isProductFetching } =
    useProductById(productIdToFetch);

  useEffect(() => {
    if (fetchedProductData && !isProductFetching) {
      console.log('fetchedProductData', fetchedProductData);

      setProductData(fetchedProductData as Product);
      setShowEditModal(true);
      setProductIdToFetch(null);
    }
  }, [fetchedProductData, isProductFetching]);

  const onConfirm = async () => {
    try {
      setLoading(true);
      deleteProduct(data.id!);
      setOpen(false);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClick = (id: number) => {
    setMode(false);
    setProductIdToFetch(id);
  };

  const handleModalOpenChange = (isOpen: boolean) => {
    setShowEditModal(isOpen);
    if (!isOpen) {
      setProductData(null);
      setProductIdToFetch(null);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={loading}
        title="¿Estás seguro que desea eliminar este producto?"
        description="Esta acción no se puede deshacer."
      />

      <ProductModal
        open={showEditModal}
        onOpenChange={handleModalOpenChange}
        defaultValues={productData ?? undefined}
        readOnly={mode}
      />

      <div className="flex gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleUpdateClick(data.id!)}
                disabled={isProductFetching}
              >
                {isProductFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Edit className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Editar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setOpen(true)}
                disabled={isProductFetching}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Eliminar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </>
  );
};

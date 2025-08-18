'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@repo/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/tooltip';
import { Edit, Trash } from 'lucide-react';
import { useState } from 'react';
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

  const { mutate: deleteProduct } = useDeleteProduct();

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

  const onUpdate = async (id: number) => {
    const { data: fetchedProductData } = useProductById(id);
    setMode(false);
    setShowEditModal(true);
    setProductData(
      fetchedProductData && Object.keys(fetchedProductData).length > 0
        ? (fetchedProductData as Product)
        : null,
    );
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
        onOpenChange={setShowEditModal}
        defaultValues={productData}
        readOnly={mode}
      />

      <div className="flex gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onUpdate(data.id!)}
              >
                <Edit className="h-4 w-4" />
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

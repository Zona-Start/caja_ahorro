import { AlertModal } from '@/components/shared/alert-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/shadcn/dropdown-menu';
import { Button } from '@repo/shadcn/button';
import { Edit, Eye, MoreHorizontal, Power, PowerOff, Trash } from 'lucide-react';
import { useState } from 'react';
import { useDeleteProductMutation } from '../../hooks/use-products-mutations';
import type { Product } from '../../schemas/products.schema';
import { useProductsModalStore } from '../../store/products-modal.store';
import { useToastSystem } from '@/hooks/use-toast-system';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { apiClient } from '@/lib/api-client';

interface CellActionProps {
  data: Product;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(false);

  const { mutate: deleteProduct } = useDeleteProductMutation();
  const { openModal } = useProductsModalStore();
  const { success, error } = useToastSystem();
  const queryClient = useQueryClient();

  const onConfirm = async () => {
    try {
      setLoading(true);
      deleteProduct(data.id!);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!data.id || toggling) return;
    setToggling(true);
    try {
      const newStatus = data.status === 'DISABLED' ? 'COMMING_SOON' : 'DISABLED';
      await apiClient.patch(`/inventory/products/${data.id}`, { status: newStatus });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products.all });
      success(`Producto ${newStatus === 'DISABLED' ? 'deshabilitado' : 'habilitado'} exitosamente.`);
    } catch {
      error('Error al cambiar el estado del producto.');
    } finally {
      setToggling(false);
    }
  };

  const isActive = data.status !== 'DISABLED';

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={loading}
        title="¿Estás seguro que deseas eliminar este producto?"
        description="Esta acción eliminará el producto permanentemente."
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => openModal('view', data)}>
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalles
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openModal('edit', data)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggleStatus} disabled={toggling}>
            {isActive ? (
              <PowerOff className="mr-2 h-4 w-4 text-amber-500" />
            ) : (
              <Power className="mr-2 h-4 w-4 text-green-500" />
            )}
            {isActive ? 'Deshabilitar' : 'Habilitar'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpen(true)} className="text-red-600">
            <Trash className="mr-2 h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

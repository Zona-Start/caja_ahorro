import { useState } from 'react';
import { AlertModal } from '@/components/shared/alert-modal';
import { Button } from '@repo/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/shadcn/dropdown-menu';
import { Ban, Edit, Eye, MoreHorizontal, Trash2 } from 'lucide-react';
import type { Supplier } from '../../schemas/suppliers.schema';
import {
  useDeleteSupplierMutation,
  useToggleSupplierStatusMutation,
} from '../../hooks/use-suppliers-mutations';
import { useSuppliersModalStore } from '../../store/suppliers-modal.store';
import { useAuthStore } from '@/stores/auth.store';

interface SuppliersCellActionProps {
  data: Supplier;
}

export function SuppliersCellAction({ data }: SuppliersCellActionProps) {
  const [loading, setLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openToggle, setOpenToggle] = useState(false);
  const { openModal } = useSuppliersModalStore();

  const deleteMutation = useDeleteSupplierMutation();
  const toggleMutation = useToggleSupplierStatusMutation();
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const onConfirmDelete = async () => {
    try {
      setLoading(true);
      await deleteMutation.mutateAsync(data.id);
      setOpenDelete(false);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onConfirmToggle = async () => {
    try {
      setLoading(true);
      await toggleMutation.mutateAsync(data.id);
      setOpenToggle(false);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isActive = data.status === 'ACTIVE';

  return (
    <>
      <AlertModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={onConfirmDelete}
        loading={loading}
        title="¿Estás seguro de eliminar este proveedor?"
        description="Esta acción no se puede deshacer. El proveedor será eliminado permanentemente."
      />

      <AlertModal
        isOpen={openToggle}
        onClose={() => setOpenToggle(false)}
        onConfirm={onConfirmToggle}
        loading={loading}
        title={isActive ? '¿Desactivar este proveedor?' : '¿Activar este proveedor?'}
        description={isActive
          ? 'El proveedor será desactivado y no aparecerá en selecciones activas.'
          : 'El proveedor será activado y estará disponible nuevamente.'}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => openModal('view', data)}>
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalles
          </DropdownMenuItem>

          {hasPermission('purchasing:suppliers', 'update') && (
            <DropdownMenuItem onClick={() => openModal('edit', data)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />

          {hasPermission('purchasing:suppliers', 'update') && (
            <DropdownMenuItem onClick={() => setOpenToggle(true)}>
              <Ban className="mr-2 h-4 w-4" />
              {isActive ? 'Desactivar' : 'Activar'}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {hasPermission('purchasing:suppliers', 'delete') && (
            <DropdownMenuItem
              onClick={() => setOpenDelete(true)}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

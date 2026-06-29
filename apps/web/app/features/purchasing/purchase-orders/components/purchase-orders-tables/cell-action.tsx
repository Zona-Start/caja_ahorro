import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/shadcn/dropdown-menu';
import { AlertModal } from '@/components/shared/alert-modal';
import { Button } from '@repo/shadcn/button';
import { EllipsisVertical, Eye, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { PurchaseOrderApi } from '../../schemas/purchase-orders-api.schema';
import { useDeletePurchaseOrderMutation } from '../../hooks/use-purchase-orders-mutations';
import { usePurchaseOrdersModalStore } from '../../store/purchase-orders-modal.store';

export function CellAction({ data }: { data: PurchaseOrderApi }) {
  const [openDelete, setOpenDelete] = useState(false);
  const { openModal } = usePurchaseOrdersModalStore();
  const { mutate: deleteOrder } = useDeletePurchaseOrderMutation();
  const canDelete = data.status === 'DRAFT' || data.status === 'PENDING';

  return (
    <>
      <AlertModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={() => deleteOrder(data.id)}
        loading={false}
        title="Anular orden de compra"
        description={`¿Está seguro de anular la orden ${data.orderNumber}?`}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <EllipsisVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => openModal('view', { id: data.id })}>
            <Eye className="h-4 w-4 mr-2" /> Ver Detalles
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openModal('edit', { id: data.id })}>
            <Pencil className="h-4 w-4 mr-2" /> Editar
          </DropdownMenuItem>
          {canDelete && (
            <DropdownMenuItem className="text-destructive" onClick={() => setOpenDelete(true)}>
              <Trash2 className="h-4 w-4 mr-2" /> Anular
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

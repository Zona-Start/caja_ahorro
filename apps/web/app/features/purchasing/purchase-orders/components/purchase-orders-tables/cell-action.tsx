import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@repo/shadcn/dropdown-menu';
import { AlertModal } from '@/components/shared/alert-modal';
import { Button } from '@repo/shadcn/button';
import { CheckCircle, EllipsisVertical, Eye, FileDown, Loader2, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { PurchaseOrderApi } from '../../schemas/purchase-orders-api.schema';
import { useDeletePurchaseOrderMutation, useApprovePurchaseOrderMutation, useDownloadPurchaseOrderPdfMutation } from '../../hooks/use-purchase-orders-mutations';
import { usePurchaseOrdersModalStore } from '../../store/purchase-orders-modal.store';
import { useAuthStore } from '@/stores/auth.store';

export function CellAction({ data }: { data: PurchaseOrderApi }) {
  const [openDelete, setOpenDelete] = useState(false);
  const [openApprove, setOpenApprove] = useState(false);
  const { openModal } = usePurchaseOrdersModalStore();
  const { mutate: deleteOrder } = useDeletePurchaseOrderMutation();
  const { mutate: approveOrder, isPending: approving } = useApprovePurchaseOrderMutation();
  const { mutate: downloadPdf, isPending: downloading } = useDownloadPurchaseOrderPdfMutation();
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const canEdit = data.status === 'DRAFT';
  const canApprove = data.status === 'DRAFT';
  const canDownload = data.status !== 'DRAFT';

  const handleApprove = () => {
    approveOrder(data.id, {
      onSuccess: () => setOpenApprove(false),
    });
  };

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
      <AlertModal
        isOpen={openApprove}
        onClose={() => setOpenApprove(false)}
        onConfirm={handleApprove}
        loading={approving}
        title="Aprobar orden de compra"
        description={`¿Está seguro de aprobar la orden ${data.orderNumber}?`}
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
          {canApprove && hasPermission("purchasing:orders", "approve") && (
            <DropdownMenuItem onClick={() => setOpenApprove(true)}>
              <CheckCircle className="h-4 w-4 mr-2 text-emerald-600" /> Aprobar
            </DropdownMenuItem>
          )}
          {canApprove && hasPermission("purchasing:orders", "update") && (
            <DropdownMenuItem onClick={() => openModal('edit', { id: data.id })}>
              <Pencil className="h-4 w-4 mr-2" /> Editar
            </DropdownMenuItem>
          )}
          {canDownload && hasPermission("purchasing:orders", "read") && (
            <DropdownMenuItem onClick={() => downloadPdf(data.id)} disabled={downloading}>
              {downloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4 mr-2 text-blue-600" />
              )}
              Descargar PDF
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {canEdit && hasPermission("purchasing:orders", "delete") && (
            <DropdownMenuItem className="text-destructive" onClick={() => setOpenDelete(true)}>
              <Trash2 className="h-4 w-4 mr-2" /> Anular
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

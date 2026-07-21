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
import { CheckCircle, Edit, Eye, MoreHorizontal, XCircle } from 'lucide-react';
import type { SupplierInvoiceApi } from '../../schemas/supplier-invoice-api.schema';
import { useDeleteSupplierInvoiceMutation, useApproveSupplierInvoiceMutation } from '../../hooks/use-supplier-invoices-mutations';
import { useSupplierInvoicesModalStore } from '../../store/supplier-invoices-modal.store';

interface SupplierInvoicesCellActionProps {
  data: SupplierInvoiceApi;
}

export function SupplierInvoicesCellAction({ data }: SupplierInvoicesCellActionProps) {
  const [loading, setLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openApprove, setOpenApprove] = useState(false);
  const { openModal } = useSupplierInvoicesModalStore();
  const deleteMutation = useDeleteSupplierInvoiceMutation();
  const approveMutation = useApproveSupplierInvoiceMutation();

  const onConfirmDelete = async () => {
    try {
      setLoading(true);
      await deleteMutation.mutateAsync(data.id);
      setOpenDelete(false);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const onConfirmApprove = async () => {
    try {
      setLoading(true);
      await approveMutation.mutateAsync(data.id);
      setOpenApprove(false);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const isDraft = data.status === 'DRAFT';

  return (
    <>
      <AlertModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={onConfirmDelete}
        loading={loading}
        title="¿Estás seguro de cancelar esta factura?"
        description="Esta acción no se puede deshacer."
      />

      <AlertModal
        isOpen={openApprove}
        onClose={() => setOpenApprove(false)}
        onConfirm={onConfirmApprove}
        loading={loading}
        title="¿Aprobar factura?"
        description="Al aprobar la factura se generarán la cuenta por pagar, movimientos de inventario y asientos contables correspondientes. Esta acción no se puede deshacer."
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

          {isDraft && (
            <DropdownMenuItem onClick={() => openModal('edit', data)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
          )}

          {isDraft && (
            <DropdownMenuItem onClick={() => setOpenApprove(true)}>
              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
              Aprobar
            </DropdownMenuItem>
          )}

          {isDraft && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setOpenDelete(true)}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

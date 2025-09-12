'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@repo/shadcn/button';
import { Toaster } from '@repo/shadcn/components/ui/toaster';
import { toast } from '@repo/shadcn/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/tooltip';
import { Edit, Eye, FileCheck, Trash } from 'lucide-react';
import { useState } from 'react';
import {
  useCancelSupplierInvoice,
  useSupplierInvoiceMutation,
} from '../../hooks/use-mutation-supplier-invoice';
import { SupplierInvoiceStatusEnum } from '../../schemas/supplier-invoice-options';
import { SupplierInvoice } from '../../schemas/supplier-invoice.schema';
import { SupplierInvoiceDetailsModal } from '../supplier-invoice-details-modal';
import { SupplierInvoiceModal } from '../supplier-invoice-modal';

interface CellActionProps {
  data: SupplierInvoice;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [open, setOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  const { mutate: cancelSupplierInvoice, isPending: isCancelling } =
    useCancelSupplierInvoice();
  const { mutate: updateInvoice, isPending: isUpdating } =
    useSupplierInvoiceMutation();

  const onConfirmDelete = () => {
    cancelSupplierInvoice(data.id!, {
      onSuccess: () => {
        setOpen(false);
      },
    });
  };

  const onConfirmAccount = () => {
    const { supplierName, ...payloadWithoutId } = data;

    const payload = {
      ...payloadWithoutId,
      status: SupplierInvoiceStatusEnum.ACCOUNTED_FOR,
    };

    updateInvoice(payload, {
      onSuccess: () => {
        setShowAccountModal(false);
      },
    });
  };

  const showNotAllowedToast = (description: string) => {
    toast({
      variant: 'destructive',
      title: 'Acción no permitida',
      description: description,
    });
  };

  const handleEdit = () => {
    if (data.status === 'DRAFT' || data.status === 'PENDING') {
      setShowEditModal(true);
    } else {
      showNotAllowedToast(
        'Solo se pueden editar facturas en estado BORRADOR o PENDIENTE.',
      );
    }
  };

  const handleDelete = () => {
    if (
      data.status === 'DRAFT' ||
      data.status === 'PENDING' ||
      data.status === 'ACCOUNTED_FOR'
    ) {
      setOpen(true);
    } else {
      showNotAllowedToast(
        'Solo se pueden anular facturas en estado BORRADOR o PENDIENTE.',
      );
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirmDelete}
        loading={isCancelling}
        title="¿Estás seguro que desea cancelar esta factura?"
        description="Esta acción no se puede deshacer."
      />
      <AlertModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        onConfirm={onConfirmAccount}
        loading={isUpdating}
        title="¿Estás seguro que desea Contabilizar esta factura?"
        description="Esta acción no se puede deshacer."
      />
      <Toaster />
      <SupplierInvoiceModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        defaultValues={data}
      />

      {showDetailsModal && (
        <SupplierInvoiceDetailsModal
            open={showDetailsModal}
            onOpenChange={setShowDetailsModal}
            invoice={data}
        />
      )}

      <div className="flex gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setShowDetailsModal(true);
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ver</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleEdit}
                disabled={
                  data.status === 'PAID' ||
                  data.status === 'ACCOUNTED_FOR' ||
                  data.status === 'CANCELLED'
                }
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
                onClick={() => {
                  setShowAccountModal(true);
                }}
                disabled={data.status !== 'PENDING'}
              >
                <FileCheck className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Contabilizar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleDelete}
                disabled={data.status === 'PAID' || data.status === 'CANCELLED'}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Cancelar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </>
  );
};

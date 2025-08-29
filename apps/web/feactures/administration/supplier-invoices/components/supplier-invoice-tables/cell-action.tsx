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
import { Edit, Eye, Trash } from 'lucide-react';
import { useState } from 'react';
import { useCancelSupplierInvoice } from '../../hooks/use-mutation-supplier-invoice';
import { SupplierInvoice } from '../../schemas/supplier-invoice.schema';
import { SupplierInvoiceModal } from '../supplier-invoice-modal';

interface CellActionProps {
  data: SupplierInvoice;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const { mutate: cancelSupplierInvoice } = useCancelSupplierInvoice();

  const onConfirmDelete = async () => {
    try {
      setLoading(true);
      cancelSupplierInvoice(data.id!); 
      setOpen(false);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
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
    if (data.status === 'DRAFT' || data.status === 'PENDING') {
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
        loading={loading}
        title="¿Estás seguro que desea anular esta factura?"
        description="Esta acción no se puede deshacer."
      />
      <Toaster />
      <SupplierInvoiceModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        defaultValues={data}
      />

      <SupplierInvoiceModal
        open={showViewModal}
        onOpenChange={setShowViewModal}
        defaultValues={data}
        readOnly={true}
      />

      <div className="flex gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setShowViewModal(true);
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
              <Button variant="outline" size="icon" onClick={handleEdit}>
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
              <Button variant="outline" size="icon" onClick={handleDelete}>
                <Trash className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Anular</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </>
  );
};

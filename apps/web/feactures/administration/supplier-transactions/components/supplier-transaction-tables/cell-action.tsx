'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { useToastSystem } from '@/hooks/use-toast-system';
import { Button } from '@repo/shadcn/button';
import { Toaster } from '@repo/shadcn/components/ui/toaster';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/tooltip';
import { Edit, Eye, Trash } from 'lucide-react';
import { useState } from 'react';
import { useDeleteSupplierTransaction } from '../../hooks/use-mutation-supplier-transaction';
import { SupplierTransaction } from '../../schemas/supplier-transaction.schema';
import { SupplierTransactionModal } from '../supplier-transaction-modal';

interface CellActionProps {
  data: SupplierTransaction;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const toast = useToastSystem();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const { mutate: deleteSupplierTransaction } = useDeleteSupplierTransaction();

  const onConfirm = async () => {
    try {
      setLoading(true);
      deleteSupplierTransaction(data.id!);
      setOpen(false);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (data.status === 'ACTIVE') {
      setShowEditModal(true);
    } else {
      toast.warning({
        title: 'No se puede editar',
        description: `Solo se puede editar si su estatus es activa`,
      });
    }
  };

  const onDeleteMessage = async () => {
    toast.warning({
      title: 'No se puede eliminar la transacción',
      description: `Solo se puede eliminar si su estatus es activa`,
    });
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={loading}
        title="¿Estás seguro que desea eliminar esta transacción?"
        description="Esta acción no se puede deshacer."
      />
      <Toaster />
      <SupplierTransactionModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        defaultValues={{
          ...data,
        }}
      />

      <SupplierTransactionModal
        open={showViewModal}
        onOpenChange={(open) => {
          setShowViewModal(open);
        }}
        defaultValues={{
          ...data,
        }}
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
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (data.status === 'ACTIVE') {
                    setOpen(true);
                  } else {
                    onDeleteMessage();
                  }
                }}
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

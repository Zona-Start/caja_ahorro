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
import { useDeleteAccountPayable } from '../../hooks/use-mutation-account-payable';
import { AccountPayable } from '../../schemas/account-payable.schema';
import { AccountPayableModal } from '../account-payable-modal';

interface CellActionProps {
  data: AccountPayable;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const { mutate: deleteAccountPayable } = useDeleteAccountPayable();

  const onConfirm = async () => {
    try {
      setLoading(true);
      deleteAccountPayable(data.id!);
      setOpen(false);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (data.status === 'PENDING' || data.status === 'PARTIALLY_PAID') {
      setShowEditModal(true);
    } else {
      toast({
        variant: 'destructive',
        title: 'No se puede editar',
        description: `Solo se puede editar si su estatus es pendiente o parcialmente pagada`,
      });
    }
  };

  const onDeleteMessage = async () => {
    toast({
      variant: 'destructive',
      title: 'No se puede eliminar la cuenta por pagar',
      description: `Solo se puede eliminar si su estatus es pendiente o parcialmente pagada`,
    });
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={loading}
        title="¿Estás seguro que desea eliminar esta cuenta por pagar?"
        description="Esta acción no se puede deshacer."
      />
      <Toaster />
      <AccountPayableModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        defaultValues={{
          ...data,
        }}
      />

      <AccountPayableModal
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
                  if (data.status === 'PENDING' || data.status === 'PARTIALLY_PAID') {
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

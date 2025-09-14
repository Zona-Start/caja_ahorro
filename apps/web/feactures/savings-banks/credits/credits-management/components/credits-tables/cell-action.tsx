'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@repo/shadcn/button';
import { Toaster } from '@repo/shadcn/toaster';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/tooltip';
import { Eye, FileCheck, Trash } from 'lucide-react';
import { useState } from 'react';
import {
  useAprobedCreditMutation,
  useDeleteCredit,
} from '../../hooks/use-credits-management-mutation';
import { CreditManagement } from '../../schemas/credits-management.schema';
import { CreditDetailsModal } from '../credit-details-modal';

interface CellActionProps {
  data: CreditManagement;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showAprobedModal, setShowAprobedModal] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const { mutate: deleteCredit } = useDeleteCredit();

  const { mutate: aprobeCredit, isPending: isUpdating } =
    useAprobedCreditMutation();

  const onConfirmDelete = async () => {
    try {
      setLoading(true);
      deleteCredit(Number(data.id!));
      setOpen(false);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onConfirmUpdate = async () => {
    aprobeCredit(Number(data.id!), {
      onSuccess: () => {
        setShowAprobedModal(false);
      },
    });
  };

  return (
    <>
      <CreditDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        credit={data}
      />
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirmDelete}
        loading={loading}
        title="¿Estás seguro que desea eliminar el Crédito? "
        description="Esta acción no se puede deshacer."
      />

      <AlertModal
        isOpen={showAprobedModal}
        onClose={() => setShowAprobedModal(false)}
        onConfirm={onConfirmUpdate}
        loading={isUpdating}
        title="¿Estás seguro que desea Aprobar este Crédito?"
        description="Esta acción no se puede deshacer."
      />
      <Toaster />
      <div className="flex gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsDetailsModalOpen(true)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ver Detalles</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                disabled={data.status !== 'REQUESTED'}
                onClick={() => {
                  setShowAprobedModal(true);
                }}
              >
                <FileCheck className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Aprobar</p>
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
                disabled={data.status !== 'REQUESTED'}
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
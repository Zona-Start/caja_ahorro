'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@repo/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/tooltip';
import { Edit, Eye, Trash } from 'lucide-react';
import { useState } from 'react';
import { useDeleteAssociate } from '../../hooks/use-associate-mutation';
import { useAssociatesById } from '../../hooks/use-query-associates';
import { Associates } from '../../schemas/associates.schema';
import { AssociatesModal } from '../associates-modal';

interface CellActionProps {
  data: Associates;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const { mutate: deleteAccount } = useDeleteAssociate();
  const [associateId, setAssociateId] = useState<number | null>(null);

  const { data: associateData } = useAssociatesById(associateId!, {
    enabled: !!associateId,
  });

  const onConfirm = async () => {
    try {
      setLoading(true);
      deleteAccount(data.id!);
      setOpen(false);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setAssociateId(data.id!);
    setShowEditModal(true);
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={loading}
        title="¿Estás seguro que desea eliminar al Asociado?"
        description="Esta acción no se puede deshacer."
      />

      {associateData?.data && (
        <>
          <AssociatesModal
            open={showEditModal}
            onOpenChange={(open) => {
              setShowEditModal(open);
              if (!open) setAssociateId(null);
            }}
            defaultValues={{
              ...associateData.data,
              dateGraduation: associateData.data.dateGraduation || undefined,
              charge: associateData.data.charge || undefined,
              isPayrollCredit:
                associateData.data.isPayrollCredit === true ? 'true' : 'false',
            }}
          />

          <AssociatesModal
            open={showViewModal}
            onOpenChange={(open) => {
              setShowViewModal(open);
              if (!open) setAssociateId(null);
            }}
            defaultValues={{
              ...associateData.data,
              dateGraduation: associateData.data.dateGraduation || undefined,
              charge: associateData.data.charge || undefined,
              isPayrollCredit:
                associateData.data.isPayrollCredit === true ? 'true' : 'false',
            }}
            readOnly={true}
          />
        </>
      )}

      <div className="flex gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setAssociateId(data.id!);
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
                onClick={() => setOpen(true)}
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

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
import { useDeleteAssociate } from '../../hooks/use-associate-mutation';
import { useAssociatesById } from '../../hooks/use-query-associates';
import { AssociatesMutate } from '../../schemas/associates.schema';
import { AssociatesModal } from '../associates-modal';

interface CellActionProps {
  data: AssociatesMutate;
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
    const allowedStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];

    if (allowedStatuses.includes(data.status)) {
      setAssociateId(data.id!);
      setShowEditModal(true);
    } else {
      toast({
        variant: 'destructive',
        title: 'No se puede editar el asociado',
        description: 'El estatus del asociado no permite modificación',
      });
    }
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
              birthdate: associateData.data.birthdate
                ? new Date(associateData.data.birthdate)
                : undefined,
              dateAdmission: associateData.data.dateAdmission
                ? new Date(associateData.data.dateAdmission)
                : undefined,
              dateGraduation: associateData.data.dateGraduation
                ? new Date(associateData.data.dateGraduation)
                : undefined,
              jobTitle: associateData.data.jobTitle || undefined,
              isPayrollCredit: associateData.data.isPayrollCredit,
              baseSalary: String(
                parseInt(associateData.data.baseSalary).toFixed(2),
              ),
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
              birthdate: associateData.data.birthdate
                ? new Date(associateData.data.birthdate)
                : undefined,
              dateAdmission: associateData.data.dateAdmission
                ? new Date(associateData.data.dateAdmission)
                : undefined,
              dateGraduation: associateData.data.dateGraduation
                ? new Date(associateData.data.dateGraduation)
                : undefined,
              jobTitle: associateData.data.jobTitle || undefined,
              isPayrollCredit: associateData.data.isPayrollCredit,
              baseSalary: String(
                parseInt(associateData.data.baseSalary).toFixed(2),
              ),
            }}
            readOnly={true}
          />
        </>
      )}
      <Toaster />
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

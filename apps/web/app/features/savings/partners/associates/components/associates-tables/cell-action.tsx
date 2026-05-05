import { useState } from 'react';
import { Edit, Eye, Trash } from 'lucide-react';
import { Button } from '@repo/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/tooltip';


import { AlertModal } from '@/components/shared/alert-modal';
import { useDeleteAssociateMutation, useAssociateQuery } from '../../hooks/use-associates-query';
import { type AssociatesMutate } from '../../schemas/associates.schema';
import { AssociateViewModal } from '../associates-view-modal';
import { AssociatesModal } from '../associates-modal';
import { toast } from '@repo/shadcn/hooks/use-toast.ts';

interface CellActionProps {
  data: AssociatesMutate;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [open, setOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [associateId, setAssociateId] = useState<number | null>(null);

  const { mutate: deleteAssociate, isPending: loading } = useDeleteAssociateMutation();
  
  const { data: associateData } = useAssociateQuery(associateId!);

  const onConfirm = async () => {
    deleteAssociate(data.id!, {
      onSuccess: () => setOpen(false),
    });
  };

  const allowedStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
  
  const handleEdit = () => {
    if (allowedStatuses.includes(data.status)) {
      setAssociateId(data.id!);
      setShowEditModal(true);
    } else {
      toast({
        title: 'Error',
        description:
          "El estatus del asociado no permite modificación",
        variant: 'destructive',
      });
    }
  };

  const handleView = () => {
    setAssociateId(data.id!);
    setShowViewModal(true);
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
              baseSalary: String(Number(associateData.data.baseSalary).toFixed(2)),
            }}
          />

          <AssociateViewModal
            open={showViewModal}
            onOpenChange={(open: any) => {
              setShowViewModal(open);
              if (!open) setAssociateId(null);
            }}
            associateData={{
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
              baseSalary: String(Number(associateData.data.baseSalary).toFixed(2)),
            }}
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
                onClick={handleView}
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
                disabled={!allowedStatuses.includes(data.status)}
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

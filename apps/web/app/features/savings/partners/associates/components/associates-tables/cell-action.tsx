import { AlertModal } from '@/components/shared/alert-modal';
import { Button } from '@repo/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/shadcn/dropdown-menu';
import { toast } from '@repo/shadcn/hooks/use-toast';
import { Edit, Eye, MoreHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
  useAssociateQuery,
  useDeleteAssociateMutation,
  useInactiveAssociateMutation,
} from '../../hooks/use-associates-query';
import { type AssociatesMutate } from '../../schemas/associates.schema';
import { AssociatesModal } from '../associates-modal';
import { AssociatesDetailsModal } from '../associates-details-modal';

interface CellActionProps {
  data: AssociatesMutate;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [openDelete, setOpenDelete] = useState(false);
  const [openInactive, setOpenInactive] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [associateId, setAssociateId] = useState<string | null>(null);

  const { mutate: deleteAssociate, isPending: loading } =
    useDeleteAssociateMutation();

  const { mutate: inactiveAssociate, isPending: inactiveLoading } =
    useInactiveAssociateMutation();

  const { data: associateData } = useAssociateQuery(associateId!);

  const onConfirm = async () => {
    deleteAssociate(data.id!, {
      onSuccess: () => setOpenDelete(false),
    });
  };

  const onInactive = async () => {
    inactiveAssociate(data.id!, {
      onSuccess: () => setOpenInactive(false),
    });
  };

  const allowedStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];

  const handleEdit = () => {
    if (allowedStatuses.includes(data.status)) {
      setAssociateId(data.id!);
      setOpenEdit(true);
    } else {
      toast({
        title: 'Error',
        description: 'El estatus del asociado no permite modificación',
        variant: 'destructive',
      });
    }
  };

  const handleView = () => {
    setAssociateId(data.id!);
    setOpenView(true);
  };

  return (
    <>
      <AlertModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={onConfirm}
        loading={loading}
        title="¿Estás seguro que desea eliminar al Asociado?"
        description="Esta acción no se puede deshacer."
      />

      <AlertModal
        isOpen={openInactive}
        onClose={() => setOpenInactive(false)}
        onConfirm={onInactive}
        loading={inactiveLoading}
        title="¿Estás seguro que desea inactivar al Asociado?"
        description="Esta acción no se puede deshacer."
      />

      {associateData?.data && (
        <>
          <AssociatesModal
            open={openEdit}
            onOpenChange={(open) => {
              setOpenEdit(open);
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
                Number(associateData.data.baseSalary).toFixed(2),
              ),
            }}
          />

          <AssociatesDetailsModal
            open={openView}
            onOpenChange={(open) => {
              setOpenView(open);
              if (!open) setAssociateId(null);
            }}
            associateId={associateId!}
          />
        </>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleView}>
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalles
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleEdit}
            disabled={!allowedStatuses.includes(data.status)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setOpenInactive(true)}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <Eye className="mr-2 h-4 w-4" />
            Inactivar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setOpenDelete(true)}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

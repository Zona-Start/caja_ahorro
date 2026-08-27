import { useState } from 'react';
import {
  Banknote,
  Calculator,
  Eye,
  FileCheck,
  MoreHorizontal,
  Trash,
} from 'lucide-react';
import { AlertModal } from '@/components/shared/alert-modal';
import { Button } from '@repo/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/shadcn/dropdown-menu';
import {
  useApproveWithdrawalMutation,
  useDeleteWithdrawalMutation,
  useProcessWithdrawalMutation,
} from '../../hooks/use-withdrawal-query';
import { type WithdrawalPaymentApi } from '../../schemas/withdrawal-api-response';
import { useAuthStore } from '@/stores/auth.store';

interface CellActionProps {
  data: WithdrawalPaymentApi;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [openDelete, setOpenDelete] = useState(false);
  const [openApprove, setOpenApprove] = useState(false);
  const [openProcess, setOpenProcess] = useState(false);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const { mutate: deleteWithdrawal, isPending: deleting } =
    useDeleteWithdrawalMutation();
  const { mutate: approveMutation, isPending: isUpdating } =
    useApproveWithdrawalMutation();
  const { mutate: processMutation, isPending: isProcessing } =
    useProcessWithdrawalMutation();

  const onDeleteConfirm = () => {
    deleteWithdrawal(data.id, {
      onSettled: () => setOpenDelete(false),
    });
  };

  const onApproveConfirm = () => {
    approveMutation(data.id, {
      onSettled: () => setOpenApprove(false),
    });
  };

  const onProcessConfirm = () => {
    processMutation(data.id, {
      onSettled: () => setOpenProcess(false),
    });
  };

  const handleView = () => {
    const event = new CustomEvent('withdrawal:view', { detail: data });
    window.dispatchEvent(event);
  };

  const handleDisburse = () => {
    const event = new CustomEvent('withdrawal:disburse', { detail: data });
    window.dispatchEvent(event);
  };

  const isItemBased = data.isHouseComercial || data.isInternalInventory;

  return (
    <>
      <AlertModal
        isOpen={openApprove}
        onClose={() => setOpenApprove(false)}
        onConfirm={onApproveConfirm}
        loading={isUpdating}
        title="Aprobar Retiro"
        description="¿Estás seguro que deseas aprobar este retiro?"
      />

      <AlertModal
        isOpen={openProcess}
        onClose={() => setOpenProcess(false)}
        onConfirm={onProcessConfirm}
        loading={isProcessing}
        title="Procesar Retiro"
        description="¿Estás seguro que deseas procesar este retiro?"
      />

      <AlertModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={onDeleteConfirm}
        loading={deleting}
        title="Anular Retiro"
        description="¿Estás seguro que deseas anular el retiro? Esta acción no se puede deshacer."
      />

      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú de acciones</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleView}>
              <Eye className="mr-2 h-4 w-4" />
              Ver Detalles
            </DropdownMenuItem>

            {data.status === 'REQUESTED' && hasPermission("savings:withdrawals", "approve") && (
              <DropdownMenuItem
                onClick={() => setOpenApprove(true)}
                disabled={isUpdating}
              >
                <FileCheck className="mr-2 h-4 w-4" />
                Aprobar
              </DropdownMenuItem>
            )}

            {data.status === 'APPROVED' && isItemBased && hasPermission("savings:withdrawals", "approve") && (
              <DropdownMenuItem
                onClick={() => setOpenProcess(true)}
                disabled={isUpdating || isProcessing}
              >
                <Calculator className="mr-2 h-4 w-4" />
                Procesar
              </DropdownMenuItem>
            )}

            {data.status === 'APPROVED' && !isItemBased && hasPermission("savings:withdrawals", "disburse") && (
              <DropdownMenuItem
                onClick={handleDisburse}
                disabled={isUpdating || isProcessing}
              >
                <Banknote className="mr-2 h-4 w-4" />
                Desembolsar
              </DropdownMenuItem>
            )}

            {data.status === 'REQUESTED' && hasPermission("savings:withdrawals", "reject") && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setOpenDelete(true)}
                  disabled={deleting}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Anular
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};

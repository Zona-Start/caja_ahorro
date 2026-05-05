import { useState } from 'react';
import { Banknote, Calculator, Eye, FileCheck, Trash } from 'lucide-react';
import { Button } from '@repo/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/tooltip';
import {
  useApproveWithdrawalMutation,
  useDeleteWithdrawalMutation,
  useProcessWithdrawalMutation,
} from '../../hooks/use-withdrawal-query';
import { type WithdrawalPaymentApi } from '../../schemas/withdrawal-api-response';
import { WithdrawalDetailsModal } from '../withdrawal-details-modal';
import { WithdrawalDisbursementModal } from '../withdrawal-disbursement-modal';

interface CellActionProps {
  data: WithdrawalPaymentApi;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [showAprobedModal, setShowAprobedModal] = useState(false);
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const { mutate: deleteWithdrawal } = useDeleteWithdrawalMutation();
  const { mutate: approveMutation, isPending: isUpdating } = useApproveWithdrawalMutation();
  const { mutate: processMutation, isPending: isProcessing } = useProcessWithdrawalMutation();

  const onConfirmDelete = () => {
    if (window.confirm('¿Estás seguro que desea anular el retiro? Esta acción no se puede deshacer.')) {
      deleteWithdrawal(Number(data.id!));
    }
  };

  const onConfirmApprove = () => {
    if (window.confirm('¿Estás seguro que desea Aprobar este retiro?')) {
      approveMutation(Number(data.id!), {
        onSuccess: () => setShowAprobedModal(false),
      });
    }
  };

  const onConfirmProcess = () => {
    if (window.confirm('¿Estás seguro que desea Procesar este retiro?')) {
      processMutation(Number(data.id!), {
        onSuccess: () => setShowProcessModal(false),
      });
    }
  };

  return (
    <>
      <WithdrawalDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        withdrawal={data}
      />
      <WithdrawalDisbursementModal
        isOpen={showDisburseModal}
        onClose={() => setShowDisburseModal(false)}
        withdrawal={data}
      />

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

        {data.status === 'APPROVED' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    data.isHouseComercial || data.isInternalInventory
                      ? onConfirmProcess()
                      : setShowDisburseModal(true);
                  }}
                  disabled={isUpdating || isProcessing}
                >
                  {data.isHouseComercial || data.isInternalInventory ? (
                    <Calculator className="h-4 w-4" />
                  ) : (
                    <Banknote className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {data.isHouseComercial || data.isInternalInventory
                    ? 'Procesar'
                    : 'Desembolsar'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {data.status === 'REQUESTED' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onConfirmApprove}
                  disabled={isUpdating}
                >
                  <FileCheck className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Aprobar</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onConfirmDelete}
                disabled={data.status !== 'REQUESTED'}
              >
                <Trash className="h-4 w-4 text-destructive" />
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

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertModal } from '@/components/shared/alert-modal';
import { Button } from '@repo/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/shadcn/dropdown-menu';
import { Ban, Eye, MoreHorizontal, Play } from 'lucide-react';
import type { BankReconciliation } from '../../schemas/bank-reconciliation.schema';
import {
  useProcessReconciliationMutation,
  useCancelReconciliationMutation,
} from '../../hooks/use-bank-reconciliation-query';

interface CellActionProps {
  data: BankReconciliation;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [openCancel, setOpenCancel] = useState(false);
  const navigate = useNavigate();

  const processMutation = useProcessReconciliationMutation();
  const cancelMutation = useCancelReconciliationMutation();

  const isInProgress = data.status === 'IN_PROGRESS';
  const isCompleted = data.status === 'COMPLETED';

  const handleProcess = () => {
    processMutation.mutate(data.id);
  };

  const handleCancel = () => {
    cancelMutation.mutate(data.id, {
      onSuccess: () => setOpenCancel(false),
    });
  };

  const handleView = () => {
    navigate(`/dashboard/configuracion/conciliaciones/${data.id}`);
  };

  return (
    <>
      <AlertModal
        isOpen={openCancel}
        onClose={() => setOpenCancel(false)}
        onConfirm={handleCancel}
        loading={cancelMutation.isPending}
        title="¿Estás seguro que deseas cancelar esta conciliación?"
        description="Los movimientos volverán a estado pendiente. Esta acción no se puede deshacer."
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleView}>
            <Eye className="mr-2 h-4 w-4" /> Ver Detalle
          </DropdownMenuItem>
          {isInProgress && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleProcess}
                className="text-green-600"
              >
                <Play className="mr-2 h-4 w-4" /> Procesar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setOpenCancel(true)}
                className="text-red-600"
              >
                <Ban className="mr-2 h-4 w-4" /> Cancelar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

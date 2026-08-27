import { useState } from 'react';
import { Banknote, CheckSquare, Eye, MoreHorizontal, Trash } from 'lucide-react';
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
import { useApproveSettlementMutation } from '../../hooks/use-settlement-query';
import { type SettlementPaymentApi } from '../../schemas/settlement-api-response';
import { useAuthStore } from '@/stores/auth.store';

interface CellActionProps {
  data: SettlementPaymentApi;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [openApprove, setOpenApprove] = useState(false);
  const { mutate: approveSettlement, isPending: isApproving } =
    useApproveSettlementMutation();
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const onApproveConfirm = () => {
    approveSettlement(data.id, {
      onSettled: () => setOpenApprove(false),
    });
  };

  const handleView = () => {
    const event = new CustomEvent('settlement:view', { detail: data });
    window.dispatchEvent(event);
  };

  const handleDisburse = () => {
    const event = new CustomEvent('settlement:disburse', { detail: data });
    window.dispatchEvent(event);
  };

  return (
    <>
      <AlertModal
        isOpen={openApprove}
        onClose={() => setOpenApprove(false)}
        onConfirm={onApproveConfirm}
        loading={isApproving}
        title="Aprobar Liquidación"
        description="Esta acción procesará la liquidación, pagará préstamos/créditos pendientes con los haberes y retirará al asociado. ¿Desea continuar?"
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

            {data.status === 'REQUESTED' && hasPermission("savings:liquidations", "update") && (
              <DropdownMenuItem
                onClick={() => setOpenApprove(true)}
                disabled={isApproving}
              >
                <CheckSquare className="mr-2 h-4 w-4" />
                Aprobar
              </DropdownMenuItem>
            )}

            {data.status === 'PROCESSED' && hasPermission("savings:liquidations", "disburse") && (
              <DropdownMenuItem onClick={handleDisburse}>
                <Banknote className="mr-2 h-4 w-4" />
                Desembolsar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};

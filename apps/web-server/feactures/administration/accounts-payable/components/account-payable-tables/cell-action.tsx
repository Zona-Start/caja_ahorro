'use client';
import { AlertModal } from '@/components/modal/alert-modal';
import { useToastSystem } from '@/hooks/use-toast-system';
import { Button } from '@repo/shadcn/button';
import { Toaster } from '@repo/shadcn/components/ui/toaster';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/tooltip';
import { Check, Eye, Trash } from 'lucide-react';
import { useState } from 'react';
import {
  useAuthorizeAccountPayableMutation,
  useDeleteAccountPayable,
} from '../../hooks/use-mutation-account-payable';
import { AccountPayableSchemaAPI } from '../../schemas';
import { AccountPayableViewModal } from '../account-payable-view-modal';

interface CellActionProps {
  data: AccountPayableSchemaAPI;
  dataApi: AccountPayableSchemaAPI;
}

export const CellAction: React.FC<CellActionProps> = ({ data, dataApi }) => {
  const toast = useToastSystem();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const { mutate: deleteAccountPayable } = useDeleteAccountPayable();
  const { mutate: authorizeAccountPayable } =
    useAuthorizeAccountPayableMutation();

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const canBeAuthorized =
    data.status === 'PENDING' && data.isAuthorizePayment === false;
  const canBeCancelled = data.status === 'PENDING' || data.status === 'EXPIRED';

  const onConfirmDelete = async () => {
    setLoading(true);
    deleteAccountPayable(data.id!, {
      onSuccess: () => setOpen(false),
      onSettled: () => setLoading(false),
    });
  };

  //funciona que llama la autorizacion de pagos
  const onConfirmAccount = () => {
    setIsUpdating(true);
    authorizeAccountPayable(data.id!, {
      onSuccess: () => {
        setIsUpdating(false);
        setShowAccountModal(false);
      },
    });
  };

  const handleActionRestriction = (action: string) => {
    toast.error({
      title: `Acción no permitida`,
      description: `No se puede ${action} una cuenta por pagar con estatus '${data.status}'.`,
    });
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirmDelete}
        loading={loading}
        title="¿Estás seguro de anular la cuenta por pagar?"
        description="Esta acción no se puede deshacer."
      />

      <AlertModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        onConfirm={onConfirmAccount}
        loading={isUpdating}
        title="¿Estás seguro que desea Autorizar el pago de esta CxP ?"
        description="Esta acción no se puede deshacer."
      />
      <Toaster />

      {showViewModal && (
        <AccountPayableViewModal
          open={showViewModal}
          onOpenChange={setShowViewModal}
          data={dataApi}
        />
      )}

      <div className="flex gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowViewModal(true)}
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
                disabled={!canBeAuthorized}
                onClick={() => {
                  setShowAccountModal(true);
                }}
              >
                <Check className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Autorizar Pago</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                disabled={!canBeCancelled}
                onClick={() =>
                  canBeCancelled
                    ? setOpen(true)
                    : handleActionRestriction('anular')
                }
              >
                <Trash className="h-4 w-4" />
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

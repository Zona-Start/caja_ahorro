'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@repo/shadcn/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/components/ui/tooltip';
import { Edit, Eye } from 'lucide-react';
import { useState } from 'react';

import { SupplierPayment } from '../../schemas';

// import { SupplierPaymentModal } from '../supplier-payment-modal'; // Descomentar cuando se cree

interface CellActionProps {
  data: SupplierPayment;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [alertOpen, setAlertOpen] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<(() => void) | null>(
    null,
  );
  const [alertTitle, setAlertTitle] = useState('');
  const [alertDescription, setAlertDescription] = useState('');

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // const { mutate: validatePayment, isPending: validating } =
  //   useValidateSupplierPayment();
  // const { mutate: approvePayment, isPending: approving } =
  //   useApproveSupplierPayment();
  // const { mutate: executePayment, isPending: executing } =
  //   useExecuteSupplierPayment();
  // const { mutate: reversePayment, isPending: reversing } =
  //   useReverseSupplierPayment();

  // const isLoading = validating || approving || executing || reversing;

  const handleAction = (
    action: () => void,
    title: string,
    description: string,
  ) => {
    setActionToConfirm(() => action);
    setAlertTitle(title);
    setAlertDescription(description);
    setAlertOpen(true);
  };

  const onConfirm = () => {
    if (actionToConfirm) {
      actionToConfirm();
      setAlertOpen(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={alertOpen}
        onClose={() => setAlertOpen(false)}
        onConfirm={onConfirm}
        title={alertTitle}
        description={alertDescription}
      />
      {/* <SupplierPaymentModal open={editModalOpen} onOpenChange={setEditModalOpen} defaultValues={data} /> */}
      {/* <SupplierPaymentModal open={viewModalOpen} onOpenChange={setViewModalOpen} defaultValues={data} readOnly /> */}

      <div className="flex gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewModalOpen(true)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ver</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {data.status === 'DRAFT' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setEditModalOpen(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Editar</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* {data.status === 'DRAFT' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    handleAction(
                      () => validatePayment(data.id),
                      'Validar Pago',
                      '¿Está seguro que desea validar este pago?',
                    )
                  }
                >
                  <Check className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Validar</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {data.status === 'PENDING' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    handleAction(
                      () => approvePayment(data.id),
                      'Aprobar Pago',
                      '¿Está seguro que desea aprobar este pago?',
                    )
                  }
                >
                  <ThumbsUp className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Aprobar</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {data.status === 'PEN_APR' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {

                  }}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Generar Lote</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {data.status === 'PROCESSED' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    handleAction(
                      () => reversePayment(data.id),
                      'Anular Pago',
                      'Esta acción no se puede deshacer. ¿Está seguro?',
                    )
                  }
                >
                  <Undo2 className="h-4 w-4 text-destructive" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Anular</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )} */}
      </div>
    </>
  );
};

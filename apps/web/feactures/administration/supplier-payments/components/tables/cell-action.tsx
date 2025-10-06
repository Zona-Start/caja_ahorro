'use client';

import { Button } from '@repo/shadcn/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/components/ui/tooltip';
import { DollarSign } from 'lucide-react';
import { useState } from 'react';

import { useOneSupplierPayments } from '../../hooks';
import { AccountPayableSchemaAPI } from '../../schemas/account-payable-api.schema';
import { PayAccountPayableModal } from '../pay-account-payable-modal';
import { PayAdvanceModal } from '../pay-advance-modal';

interface CellActionProps {
  data: AccountPayableSchemaAPI;
  tab: 'history' | 'pending'; // Add tab prop
}

export const CellAction: React.FC<CellActionProps> = ({ data, tab }) => {
  //const [alertOpen, setAlertOpen] = useState(false); //usada para modal de alerta
  const [showPayModal, setShowPayModal] = useState(false); //usado para modal formulario de pago cxp
  const [showPayAdvanceModal, setShowPayAdvanceModal] = useState(false); //usado para modal formulario de pago advance
  const [showAccountPayableGet, setshowAccountPayableGet] = useState(false); //usado para hace peticion get de los datos de ls cvp

  // const [actionToConfirm, setActionToConfirm] = useState<(() => void) | null>(
  //   null,
  // );
  // const [alertTitle, setAlertTitle] = useState('');
  // const [alertDescription, setAlertDescription] = useState('');

  // const [viewModalOpen, setViewModalOpen] = useState(false);

  // const handleAction = (
  //   action: () => void,
  //   title: string,
  //   description: string,
  // ) => {
  //   setActionToConfirm(() => action);
  //   setAlertTitle(title);
  //   setAlertDescription(description);
  //   setAlertOpen(true);
  // };

  // const onConfirm = () => {
  //   if (actionToConfirm) {
  //     actionToConfirm();
  //     setshowAccountPayableGet(false);
  //   }
  // };

  const { data: supplierPaymentsData, isLoading } = useOneSupplierPayments(
    data.id,
    {
      enabled: showAccountPayableGet,
    },
  );

  // funcion al presionar el boton pagar en pagos pendientes
  const onPyamentPending = () => {
    if (data.type === 'ADVANCE') {
      setShowPayAdvanceModal(true);
    } else {
      setShowPayModal(true);
      setshowAccountPayableGet(true);
    }
  };

  return (
    <>
      {/* <AlertModal
        isOpen={alertOpen}
        onClose={() => setAlertOpen(false)}
        onConfirm={onConfirm}
        title={alertTitle}
        description={alertDescription}
      /> */}

      {showPayModal && !isLoading && (
        <PayAccountPayableModal
          open={showPayModal}
          onOpenChange={setShowPayModal}
          data={supplierPaymentsData?.data?.data}
        />
      )}

      {showPayAdvanceModal && (
        <PayAdvanceModal
          open={showPayAdvanceModal}
          onOpenChange={setShowPayAdvanceModal}
          advance={data}
        />
      )}

      <div className="flex gap-1">
        {tab === 'history' && (
          <>
            {/* <TooltipProvider>
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
                  <p>Ver Detalles</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider> */}

            {/* <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setViewModalOpen(true)}
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Comprobante</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setViewModalOpen(true)}
                  >
                    <Redo2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reversar</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider> */}
          </>
        )}

        {tab === 'pending' && (
          <>
            {/* <TooltipProvider>
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
                  <p>Ver Detalles</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider> */}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      onPyamentPending();
                    }}
                  >
                    <DollarSign className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Pagar</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}
      </div>
    </>
  );
};

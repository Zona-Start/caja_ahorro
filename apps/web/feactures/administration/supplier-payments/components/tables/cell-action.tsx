'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@repo/shadcn/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/components/ui/tooltip';
import { DollarSign, Eye, Printer, Redo2 } from 'lucide-react';
import { useState } from 'react';

import { PayAccountPayableModal } from '../pay-account-payable-modal';

interface CellActionProps {
  data: any;
  tab: 'history' | 'pending'; // Add tab prop
}

export const CellAction: React.FC<CellActionProps> = ({ data, tab }) => {
  const [alertOpen, setAlertOpen] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<(() => void) | null>(
    null,
  );
  const [alertTitle, setAlertTitle] = useState('');
  const [alertDescription, setAlertDescription] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

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

      {showPayModal && (
        <PayAccountPayableModal
          open={showPayModal}
          onOpenChange={setShowPayModal}
          accountPayable={data}
        />
      )}

      <div className="flex gap-1">
        {tab === 'history' && (
          <>
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
            </TooltipProvider>
          </>
        )}

        {tab === 'pending' && (
          <>
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
                    onClick={() => {
                      setShowPayModal(true);
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

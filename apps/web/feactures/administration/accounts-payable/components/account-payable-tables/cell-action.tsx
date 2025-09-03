'use client';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@repo/shadcn/button';
import { Toaster } from '@repo/shadcn/components/ui/toaster';
import { toast } from '@repo/shadcn/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/tooltip';
import { DollarSign, Eye, FileText, Trash } from 'lucide-react';
import { useState } from 'react';
import { useDeleteAccountPayable } from '../../hooks/use-mutation-account-payable';
import { AccountPayableSchemaAPI } from '../../schemas';
import { AccountPayable } from '../../schemas/account-payable.schema';
import { AccountPayableModal } from '../account-payable-modal';
import { AccountPayableViewModal } from '../account-payable-view-modal';

import { PayAccountPayableModal } from '../pay-account-payable-modal';

interface CellActionProps {
  data: AccountPayable;
  dataApi: AccountPayableSchemaAPI;
}

export const CellAction: React.FC<CellActionProps> = ({ data, dataApi }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const { mutate: deleteAccountPayable } = useDeleteAccountPayable();

  // const { refetch: downloadReport } = useAccountPayableReport(data.id!, {
  //   enabled: false, // Disable automatic fetching
  // });

  const canBeModified =
    data.status === 'PENDING' || data.status === 'IN_PROGRESS';

  const canBePaid = 
    data.status === 'PENDING' || data.status === 'IN_PROGRESS';

  const onConfirmDelete = async () => {
    try {
      setLoading(true);
      deleteAccountPayable(data.id!); // Assuming id is always present

      setOpen(false);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleActionRestriction = (action: string) => {
    toast({
      variant: 'destructive',
      title: `Acción no permitida`,
      description: `No se puede ${action} una cuenta por pagar con estatus '${data.status}'.`,
    });
  };

  // const handleDownloadPdf = async () => {
  //   try {
  //     const response = await downloadReport();
  //     if (response.data) {
  //       const blob = new Blob([response.data as BlobPart], {
  //         type: 'application/pdf',
  //       });
  //       const url = window.URL.createObjectURL(blob);
  //       const a = document.createElement('a');
  //       a.href = url;
  //       a.download = `reporte-cuenta-por-pagar-${dataApi.accountsPayableNumber}.pdf`;
  //       document.body.appendChild(a);
  //       a.click();
  //       window.URL.revokeObjectURL(url);
  //       a.remove();
  //     } else {
  //     }
  //   } catch (error) {}
  // };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirmDelete}
        loading={loading}
        title="¿Estás seguro?"
        description="Esta acción no se puede deshacer."
      />
      <Toaster />
      {showEditModal && (
        <AccountPayableModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          defaultValues={data}
        />
      )}

      {showViewModal && (
        <AccountPayableViewModal
          open={showViewModal}
          onOpenChange={setShowViewModal}
          data={dataApi}
        />
      )}

      {showPayModal && (
        <PayAccountPayableModal
          open={showPayModal}
          onOpenChange={setShowPayModal}
          accountPayable={data}
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
              <p>Ver</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleDownloadPdf}>
                <FileDown className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Descargar PDF</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider> */}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                disabled={!canBePaid}
                onClick={() => {
                  if (canBePaid) {
                    setShowPayModal(true);
                  } else {
                    handleActionRestriction('pagar');
                  }
                }}
              >
                <DollarSign className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Pago</p>
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
                  // TODO: Add payment logic
                }}
              >
                <FileText className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Nota Crédito/Débito</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                disabled={!canBeModified}
                onClick={() =>
                  canBeModified
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

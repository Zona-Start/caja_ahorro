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
import { Check, Download, Eye, FileUp, Trash } from 'lucide-react';
import { useState } from 'react';
import { downloadTxtFileAction } from '../../actions/loan-disbursement/batch-actions';
import {
  useCancelLoanDisbursementBatchMutation,
  useConfirmLoanDisbursementBatchMutation,
  useMarkAsUploadedMutation,
} from '../../hooks/use-loan-disbursement-batch-mutation';
import { LoanDisbursementBatch } from '../../schemas/loan-disbursement/batch-api-response';
import { ConfirmLoanDisbursementBatchModal } from '../confirm-loan-disbursement-batch-modal';
import { LoanDisbursementBatchDetailsModal } from '../loan-disbursement/batch-details-modal';

interface CellActionProps {
  data: LoanDisbursementBatch;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const toast = useToastSystem();
  const [loading, setLoading] = useState(false);
  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const { mutate: cancelBatch } = useCancelLoanDisbursementBatchMutation();
  const { mutate: markAsUploaded } = useMarkAsUploadedMutation();
  const { mutate: confirmBatch } = useConfirmLoanDisbursementBatchMutation();

  const onConfirmCancel = async () => {
    try {
      setLoading(true);
      cancelBatch(data.id);
      setOpenCancelModal(false);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onConfirmUpload = async () => {
    try {
      setLoading(true);
      markAsUploaded(data.id);
      setOpenUploadModal(false);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onConfirmPayment = async (dto: any) => {
    try {
      setLoading(true);
      await confirmBatch({ id: data.id, dto });
      setIsConfirmModalOpen(false);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTxt = async () => {
    try {
      setLoading(true);
      const result = await downloadTxtFileAction(data.id);
      if (!result || result.content === null) {
        // ✅ Verifica si result o su contenido es null
        toast.error('No se pudo obtener el contenido del archivo.');
        return;
      }

      const blob = new Blob([result.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Archivo TXT descargado exitosamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al descargar el archivo TXT');
    } finally {
      setLoading(false);
    }
  };

  const isDraft = data.status === 'DRAFT';
  const isUploaded = data.status === 'UPLOADED';
  const isProcessed = data.status === 'PROCESSED';
  const isCancelled = data.status === 'CANCELLED';

  return (
    <>
      <LoanDisbursementBatchDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        loanId={data.id}
      />
      <ConfirmLoanDisbursementBatchModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={onConfirmPayment}
        loanId={data.id}
        loading={loading}
      />
      <AlertModal
        isOpen={openCancelModal}
        onClose={() => setOpenCancelModal(false)}
        onConfirm={onConfirmCancel}
        loading={loading}
        title="¿Estás seguro que desea anular este lote de pago?"
        description="Esta acción no se puede deshacer."
      />
      <AlertModal
        isOpen={openUploadModal}
        onClose={() => setOpenUploadModal(false)}
        onConfirm={onConfirmUpload}
        loading={loading}
        title="¿Estás seguro que desea marcar este lote como subido?"
        description="Una vez subido, el lote no podrá ser editado."
      />
      <Toaster />
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

        {isDraft && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setOpenUploadModal(true)}
                  disabled={loading}
                >
                  <FileUp className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Marcar como Subido</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {isUploaded && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDownloadTxt}
                  disabled={loading}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Descargar TXT</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {isUploaded && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsConfirmModalOpen(true)}
                  disabled={loading}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Confirmar Lote</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {(isDraft || isUploaded) && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setOpenCancelModal(true)}
                  disabled={loading}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Anular Lote</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </>
  );
};

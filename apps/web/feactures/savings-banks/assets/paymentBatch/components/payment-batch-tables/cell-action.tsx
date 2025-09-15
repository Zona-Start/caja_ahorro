'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@repo/shadcn/button';
import { Toaster } from '@repo/shadcn/toaster';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/tooltip';
import { Check, Download, Eye, FileUp, Trash, X } from 'lucide-react';
import { useState } from 'react';
import {
  useCancelPaymentBatchMutation,
  useConfirmPaymentBatchMutation,
  useMarkAsUploadedMutation,
} from '../../hooks/use-payment-batch-mutation';
import { PaymentBatch } from '../../schemas/payment-batch-api-response';
import { PAYMENT_BATCH_STATUS } from '../../schemas/payment-batch-options';
import { PaymentBatchDetailsModal } from '../payment-batch-details-modal';
import { ConfirmPaymentBatchModal } from '../confirm-payment-batch-modal';
import { downloadTxtFileAction } from '../../actions/payment-batch-actions';
import { toast } from 'sonner';

interface CellActionProps {
  data: PaymentBatch;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const { mutate: cancelBatch } = useCancelPaymentBatchMutation();
  const { mutate: markAsUploaded } = useMarkAsUploadedMutation();
  const { mutate: confirmBatch } = useConfirmPaymentBatchMutation();

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

  const isDraft = data.status === PAYMENT_BATCH_STATUS.DRAFT;
  const isUploaded = data.status === PAYMENT_BATCH_STATUS.UPLOADED;
  const isProcessed = data.status === PAYMENT_BATCH_STATUS.PROCESSED;
  const isCancelled = data.status === PAYMENT_BATCH_STATUS.CANCELLED;

  return (
    <>
      <PaymentBatchDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        paymentBatchId={data.id}
      />
      <ConfirmPaymentBatchModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={onConfirmPayment}
        paymentBatchId={data.id}
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

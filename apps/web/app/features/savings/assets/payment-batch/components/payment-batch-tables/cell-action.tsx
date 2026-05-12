import { useState } from 'react';
import { Button } from '@repo/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/tooltip';
import { Download, Eye, FileUp, Check, Trash } from 'lucide-react';
import { AlertModal } from '@repo/shadcn/modal';
import { type PaymentBatch } from '../../schemas/payment-batch-api-response';
import {
  useMarkAsUploadedMutation,
  useCancelPaymentBatchMutation,
  useDownloadTxtFileMutation,
} from '../../hooks/use-payment-batch-mutation';

interface CellActionProps {
  data: PaymentBatch;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [openCancel, setOpenCancel] = useState(false);
  const [openUpload, setOpenUpload] = useState(false);

  const { mutate: cancelBatch } = useCancelPaymentBatchMutation();
  const { mutate: markAsUploaded } = useMarkAsUploadedMutation();
  const { mutate: downloadTxt } = useDownloadTxtFileMutation();

  const onConfirmCancel = () => {
    setLoading(true);
    cancelBatch(data.id, {
      onSettled: () => {
        setLoading(false);
        setOpenCancel(false);
      },
    });
  };

  const onConfirmUpload = () => {
    setLoading(true);
    markAsUploaded(data.id, {
      onSettled: () => {
        setLoading(false);
        setOpenUpload(false);
      },
    });
  };

  const isDraft = data.status === 'DRAFT';
  const isUploaded = data.status === 'UPLOADED';

  return (
    <>
      <AlertModal
        isOpen={openCancel}
        onClose={() => setOpenCancel(false)}
        onConfirm={onConfirmCancel}
        loading={loading}
        title="Anular lote de pago"
        description="Esta accion no se puede deshacer."
      />
      <AlertModal
        isOpen={openUpload}
        onClose={() => setOpenUpload(false)}
        onConfirm={onConfirmUpload}
        loading={loading}
        title="Marcar como subido"
        description="Una vez subido, el lote no podra ser editado."
      />
      <div className="flex gap-1">
        {isDraft && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setOpenUpload(true)}
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
                  onClick={() => downloadTxt(data.id)}
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

        {(isDraft || isUploaded) && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setOpenCancel(true)}
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

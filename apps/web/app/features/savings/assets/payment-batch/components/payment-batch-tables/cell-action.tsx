import { useState } from 'react';
import { Button } from '@repo/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/shadcn/dropdown-menu';
import {
  Eye,
  FileUp,
  Download,
  CheckCheck,
  Trash,
  MoreHorizontal,
} from 'lucide-react';
import { AlertModal } from '@repo/shadcn/modal';
import { type PaymentBatch } from '../../services/payment-batch-service';
import {
  useMarkAsUploadedMutation,
  useCancelPaymentBatchMutation,
  useDownloadTxtFileMutation,
} from '../../hooks/use-payment-batch-mutation';
import { usePaymentBatchModalStore } from '../../store/payment-batch-store';
import { useAuthStore } from '@/stores/auth.store';

interface CellActionProps {
  data: PaymentBatch;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [open, setOpen] = useState(false);
  const [alertType, setAlertType] = useState<'cancel' | 'upload' | null>(null);
  const { openConfirmModal, openDetailModal } = usePaymentBatchModalStore();
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const { mutate: cancelBatch, isPending: isCancelling } =
    useCancelPaymentBatchMutation();
  const { mutate: markAsUploaded, isPending: isUploading } =
    useMarkAsUploadedMutation();
  const { mutate: downloadTxt } = useDownloadTxtFileMutation();

  const isDraft = data.status === 'DRAFT';
  const isUploaded = data.status === 'UPLOADED';
  const isProcessed = data.status === 'PROCESSED';

  const onConfirm = () => {
    if (alertType === 'cancel') {
      cancelBatch(data.id, { onSettled: () => setOpen(false) });
    } else if (alertType === 'upload') {
      markAsUploaded(data.id, { onSettled: () => setOpen(false) });
    }
  };

  const title =
    alertType === 'cancel'
      ? 'Anular Lote'
      : 'Marcar como Subido';
  const description =
    alertType === 'cancel'
      ? 'Esta acción revertirá los registros al estado anterior. No se puede deshacer.'
      : 'Al marcar como subido, los registros origen pasarán a estado "EN PROCESO DE PAGO".';

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => { if (!isCancelling && !isUploading) setOpen(false); }}
        onConfirm={onConfirm}
        loading={isCancelling || isUploading}
        title={title}
        description={description}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => openDetailModal(data.id)}>
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalles
          </DropdownMenuItem>

          {isDraft && hasPermission("savings:payments", "mass_disburse") && (
            <DropdownMenuItem
              onClick={() => { setAlertType('upload'); setOpen(true); }}
            >
              <FileUp className="mr-2 h-4 w-4" />
              Autorizar Pagos
            </DropdownMenuItem>
          )}

          {isUploaded && hasPermission("savings:payments", "mass_disburse") && (
            <>
              <DropdownMenuItem onClick={() => downloadTxt({ id: data.id, filename: data.paymentBatchReference })}>
                <Download className="mr-2 h-4 w-4" />
                Descargar TXT
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openConfirmModal(data.id)}>
                <CheckCheck className="mr-2 h-4 w-4" />
                Confirmar Desembolsos
              </DropdownMenuItem>
            </>
          )}

          {(isDraft || isUploaded) && hasPermission("savings:payments", "mass_disburse") && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => { setAlertType('cancel'); setOpen(true); }}
              >
                <Trash className="mr-2 h-4 w-4" />
                Anular Lote
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

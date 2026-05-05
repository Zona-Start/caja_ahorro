import { AlertModal } from '@/components/shared/alert-modal';
import { Button } from '@repo/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/tooltip';
import { CheckCircle, Edit, Eye, Send, Trash, XCircle } from 'lucide-react';
import { useState } from 'react';
import {
  useCancelAccountingEntryMutation,
  useDeleteAccountingEntryMutation,
  usePostAccountingEntryMutation,
  useSubmitAccountingEntryMutation,
} from '../../hooks/use-accounting-entries-mutation';
import type { AccountingEntry } from '../../schemas/accounting-entry.schema';
import { AccountingEntryModal } from '../accounting-entry-modal';
import { ViewAccountingEntryModal } from '../view-accounting-entry-modal';

interface CellActionProps {
  data: AccountingEntry;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [alertOpen, setAlertOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [action, setAction] = useState<
    'delete' | 'submit' | 'post' | 'cancel' | null
  >(null);

  const deleteEntryMutation = useDeleteAccountingEntryMutation();
  const submitEntryMutation = useSubmitAccountingEntryMutation();
  const postEntryMutation = usePostAccountingEntryMutation();
  const cancelEntryMutation = useCancelAccountingEntryMutation();

  const isPending =
    deleteEntryMutation.isPending ||
    submitEntryMutation.isPending ||
    postEntryMutation.isPending ||
    cancelEntryMutation.isPending;

  const onConfirm = async () => {
    if (!action) return;
    const id = data.id!;

    try {
      if (action === 'delete') await deleteEntryMutation.mutateAsync(id);
      if (action === 'submit') await submitEntryMutation.mutateAsync(id);
      if (action === 'post') await postEntryMutation.mutateAsync(id);
      if (action === 'cancel') await cancelEntryMutation.mutateAsync(id);
      setAlertOpen(false);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getActionDetails = () => {
    switch (action) {
      case 'delete':
        return {
          title: 'Eliminar Asiento',
          description: '¿Está seguro? Esta acción es irreversible.',
        };
      case 'submit':
        return {
          title: 'Enviar Asiento',
          description: 'Se enviará para aprobación. ¿Continuar?',
        };
      case 'post':
        return {
          title: 'Contabilizar Asiento',
          description: 'El asiento se contabilizará. ¿Continuar?',
        };
      case 'cancel':
        return {
          title: 'Anular Asiento',
          description: 'Se creará un asiento reverso. ¿Continuar?',
        };
      default:
        return { title: '', description: '' };
    }
  };

  return (
    <>
      <AlertModal
        isOpen={alertOpen}
        onClose={() => setAlertOpen(false)}
        onConfirm={onConfirm}
        loading={isPending}
        title={getActionDetails().title}
        description={getActionDetails().description}
      />
      <AccountingEntryModal
        open={editOpen}
        onOpenChange={setEditOpen}
        defaultValues={data}
      />
      <ViewAccountingEntryModal
        open={viewOpen}
        onOpenChange={setViewOpen}
        defaultValues={data}
      />

      <div className="flex gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewOpen(true)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ver Detalle</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setEditOpen(true)}
                disabled={data.status !== 'DRAFT'}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Editar</p>
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
                  setAction('submit');
                  setAlertOpen(true);
                }}
                disabled={data.status !== 'DRAFT'}
              >
                <Send className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Enviar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                disabled={data.status !== 'PENDING'}
                onClick={() => {
                  setAction('post');
                  setAlertOpen(true);
                }}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Contabilizar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {data.status !== 'POSTED' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={data.status !== 'DRAFT'}
                  onClick={() => {
                    setAction('delete');
                    setAlertOpen(true);
                  }}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Eliminar</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {data.status === 'POSTED' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setAction('cancel');
                    setAlertOpen(true);
                  }}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Anular</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </>
  );
};

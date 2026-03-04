'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@repo/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/components/ui/tooltip';
import { CheckCircle, Edit, Eye, Send, Trash, XCircle } from 'lucide-react';
import { useState } from 'react';
import {
  useCancelAccountingEntry,
  useDeleteAccountingEntry,
  usePostAccountingEntry,
  useSubmitAccountingEntry,
} from '../../hooks/use-accounting-entry-mutation';
import { AccountingEntry } from '../../schemas/accounting-entry.schema';
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

  const { mutate: deleteEntry, isPending: isDeleting } =
    useDeleteAccountingEntry();
  const { mutate: submitEntry, isPending: isSubmitting } =
    useSubmitAccountingEntry();
  const { mutate: postEntry, isPending: isPosting } = usePostAccountingEntry();
  const { mutate: cancelEntry, isPending: isCancelling } =
    useCancelAccountingEntry();

  const isPending = isDeleting || isSubmitting || isPosting || isCancelling;

  const onConfirm = () => {
    if (!action) return;
    const id = data.id!;

    const actions = {
      delete: () => deleteEntry(id),
      submit: () => submitEntry(id),
      post: () => postEntry(id),
      cancel: () => cancelEntry(id),
    };

    actions[action]();
    setAlertOpen(false);
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

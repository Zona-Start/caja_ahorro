import { AlertModal } from '@/components/shared/alert-modal';
import { Button } from '@repo/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/shadcn/dropdown-menu';
import { CheckCircle, Edit, Eye, MoreHorizontal, Send, Trash, XCircle } from 'lucide-react';
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
          description: 'Se creará un asiento reverso contabilizado automáticamente. ¿Continuar?',
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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setViewOpen(true)}>
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalle
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setEditOpen(true)}
            disabled={data.status !== 'DRAFT'}
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setAction('submit');
              setAlertOpen(true);
            }}
            disabled={data.status !== 'DRAFT'}
          >
            <Send className="mr-2 h-4 w-4" />
            Enviar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setAction('post');
              setAlertOpen(true);
            }}
            disabled={data.status !== 'PENDING'}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Contabilizar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {data.status !== 'POSTED' && (
            <DropdownMenuItem
              onClick={() => {
                setAction('delete');
                setAlertOpen(true);
              }}
              disabled={data.status !== 'DRAFT'}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <Trash className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          )}
          {data.status === 'POSTED' && (
            <DropdownMenuItem
              onClick={() => {
                setAction('cancel');
                setAlertOpen(true);
              }}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Anular
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

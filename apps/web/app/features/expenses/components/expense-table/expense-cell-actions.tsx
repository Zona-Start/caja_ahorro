import { AlertModal } from '@/components/shared/alert-modal';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@repo/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/shadcn/dropdown-menu';
import { Textarea } from '@repo/shadcn/textarea';
import { CheckCircle2, MoreHorizontal, Trash2, XCircle } from 'lucide-react';
import { useState } from 'react';
import {
  useApproveExpenseMutation,
  useDeleteExpenseMutation,
  useRejectExpenseMutation,
} from '../../hooks/use-expense-queries';
import type { Expense } from '../../schemas/expenses.schema';

interface ExpenseCellActionsProps {
  data: Expense;
}

export function ExpenseCellActions({ data }: ExpenseCellActionsProps) {
  const [openApprove, setOpenApprove] = useState(false);
  const [openReject, setOpenReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [openDelete, setOpenDelete] = useState(false);

  const approveMutation = useApproveExpenseMutation();
  const rejectMutation = useRejectExpenseMutation();
  const deleteMutation = useDeleteExpenseMutation();
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const status = data.status ?? 'PENDING_APPROVAL';
  const canDecide =
    status === 'PENDING_APPROVAL' &&
    hasPermission('treasury:expenses', 'approve');

  return (
    <>
      <AlertModal
        isOpen={openApprove}
        onClose={() => setOpenApprove(false)}
        onConfirm={() =>
          approveMutation.mutate(data.id, {
            onSuccess: () => setOpenApprove(false),
          })
        }
        loading={approveMutation.isPending}
        title="¿Aprobar este gasto?"
        description="Se descontará del saldo de la fuente seleccionada y se generará el asiento contable si aplica."
      />

      <Dialog open={openReject} onOpenChange={setOpenReject}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Rechazar Gasto</DialogTitle>
            <DialogDescription>
              El motivo quedará registrado para el solicitante.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motivo del rechazo (opcional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenReject(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={rejectMutation.isPending}
              onClick={() =>
                rejectMutation.mutate(
                  { id: data.id, reason: rejectReason || undefined },
                  {
                    onSuccess: () => {
                      setOpenReject(false);
                      setRejectReason('');
                    },
                  },
                )
              }
            >
              {rejectMutation.isPending ? 'Rechazando...' : 'Confirmar Rechazo'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={() =>
          deleteMutation.mutate(data.id, {
            onSuccess: () => setOpenDelete(false),
          })
        }
        loading={deleteMutation.isPending}
        title="¿Eliminar este gasto?"
        description="Solo los gastos pendientes o rechazados pueden eliminarse."
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canDecide && (
            <>
              <DropdownMenuItem onClick={() => setOpenApprove(true)}>
                <CheckCircle2 className="mr-2 h-4 w-4 text-[#2EA640]" />
                Aprobar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOpenReject(true)}>
                <XCircle className="mr-2 h-4 w-4 text-destructive" />
                Rechazar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {hasPermission('treasury:expenses', 'delete') &&
            status !== 'APPROVED' && (
              <DropdownMenuItem
                onClick={() => setOpenDelete(true)}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            )}
          {status === 'APPROVED' && (
            <DropdownMenuItem disabled>
              <CheckCircle2 className="mr-2 h-4 w-4 text-[#2EA640]" />
              Aprobado
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

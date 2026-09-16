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
import {
  CheckCircle2,
  HandCoins,
  MoreHorizontal,
  ScrollText,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import {
  useApproveExpenseMutation,
  useDeleteExpenseMutation,
  usePayExpenseMutation,
  useRejectExpenseMutation,
} from '../../hooks/use-expense-queries';
import type { Expense } from '../../schemas/expenses.schema';
import { ExpenseDetailsModal } from '../expense-details-modal';

interface ExpenseCellActionsProps {
  data: Expense;
}

export function ExpenseCellActions({ data }: ExpenseCellActionsProps) {
  const [openDetails, setOpenDetails] = useState(false);
  const [openApprove, setOpenApprove] = useState(false);
  const [openReject, setOpenReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [openDelete, setOpenDelete] = useState(false);
  const [openPay, setOpenPay] = useState(false);

  const approveMutation = useApproveExpenseMutation();
  const payMutation = usePayExpenseMutation();
  const rejectMutation = useRejectExpenseMutation();
  const deleteMutation = useDeleteExpenseMutation();
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const status = data.status ?? 'PENDING_APPROVAL';
  const canDecide =
    status === 'PENDING_APPROVAL' &&
    hasPermission('treasury:expenses', 'approve');

  const dueReached =
    !data.dueDate || new Date(data.dueDate).getTime() <= Date.now();
  const canPay =
    status === 'APPROVED' &&
    hasPermission('treasury:expenses', 'approve') &&
    dueReached;
  const canDelete =
    hasPermission('treasury:expenses', 'delete') &&
    status !== 'APPROVED' &&
    status !== 'PAID';

  return (
    <>
      <ExpenseDetailsModal
        expenseId={openDetails ? data.id : null}
        onOpenChange={(open) => !open && setOpenDetails(false)}
      />

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
        description="El gasto quedará Aprobado / Por Pagar. El dinero se descuenta cuando registres el pago."
      />

      <AlertModal
        isOpen={openPay}
        onClose={() => setOpenPay(false)}
        onConfirm={() =>
          payMutation.mutate(data.id, {
            onSuccess: () => setOpenPay(false),
          })
        }
        loading={payMutation.isPending}
        title="¿Registrar el pago de este gasto?"
        description="Se descontará el saldo de la cuenta bancaria y se generará el asiento contable. Esta acción no se puede deshacer."
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
          <DropdownMenuItem onClick={() => setOpenDetails(true)}>
            <ScrollText className="mr-2 h-4 w-4" />
            Ver Detalles
          </DropdownMenuItem>

          {canDecide && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setOpenApprove(true)}>
                <CheckCircle2 className="mr-2 h-4 w-4 text-[#2EA640]" />
                Aprobar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOpenReject(true)}>
                <XCircle className="mr-2 h-4 w-4 text-destructive" />
                Rechazar
              </DropdownMenuItem>
            </>
          )}

          {canPay && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setOpenPay(true)}>
                <HandCoins className="mr-2 h-4 w-4 text-primary" />
                Registrar Pago
              </DropdownMenuItem>
            </>
          )}

          {status === 'APPROVED' && !dueReached && (
            <DropdownMenuItem disabled>
              <HandCoins className="mr-2 h-4 w-4" />
              Pago desde{' '}
              {new Date(data.dueDate as string).toLocaleDateString('es-VE')}
            </DropdownMenuItem>
          )}

          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setOpenDelete(true)}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

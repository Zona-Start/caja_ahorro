'use client';

import { formatCurrency } from '@/lib/formatCurrent';
import { Button } from '@repo/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/components/ui/dialog';
import { Skeleton } from '@repo/shadcn/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/shadcn/components/ui/table';
import { useAppliedTransaction } from '../../hooks/use-query-manager-documents';

import { AppliedTransaction } from '../../schemas/manage-documents.schema';

interface AppliedTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: number | null;
  title: string;
}

const ModalContent = ({ transactionId }: { transactionId: number }) => {
  const { data, isLoading } = useAppliedTransaction(transactionId);

  if (isLoading) {
    return (
      <div className="space-y-2 pt-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  const transactions = data?.data || [];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Referencia CXP</TableHead>
          <TableHead className="text-right">Monto aplicado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.length === 0 && (
          <TableRow>
            <TableCell colSpan={2} className="text-center">
              No se encontraron aplicaciones.
            </TableCell>
          </TableRow>
        )}
        {transactions.map((item: AppliedTransaction) => (
          <TableRow key={item.id}>
            <TableCell>{item.accounPayableRefence || 'N/A'}</TableCell>
            <TableCell className="text-right">
              {formatCurrency(Number(item.amountApplied), 'VES')}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export const AppliedTransactionModal = ({
  isOpen,
  onClose,
  transactionId,
  title,
}: AppliedTransactionModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Detalles aplicación a cuentas por pagar
          </DialogDescription>
        </DialogHeader>
        {isOpen && transactionId && (
          <ModalContent transactionId={transactionId} />
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
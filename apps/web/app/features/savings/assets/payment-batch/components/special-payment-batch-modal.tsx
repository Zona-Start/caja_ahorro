'use client';

import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Button } from '@repo/shadcn/button';
import { Input } from '@repo/shadcn/input';
import { Label } from '@repo/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { Sparkles } from 'lucide-react';
import { useToastSystem } from '@/hooks/use-toast-system';
import { useBankAccountAllQuery } from '@/features/banks/bank-account/hooks/use-bank-account-query';
import { useApprovedSpecialLiquidations } from '../hooks/use-payment-batch-query';
import { useCreatePaymentBatchMutation } from '../hooks/use-payment-batch-mutation';
import { ApprovedItemsDataTable } from './approved-items-data-table';
import {
  getApprovedItemColumns,
  type PaymentBatchApprovedItem,
} from './payment-batch-columns';
import { SelectionSummary } from './selection-summary';

export function SpecialPaymentBatchModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const toast = useToastSystem();

  const [bankAccountId, setBankAccountId] = useState('');
  const [destinationAccountNumber, setDestinationAccountNumber] = useState('');
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const { data: bankAccountsData } = useBankAccountAllQuery();
  const bankAccounts = (bankAccountsData?.data || []).filter(
    (account: any) =>
      !account.currencyCode || account.currencyCode === 'VES',
  );

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useApprovedSpecialLiquidations();

  const liquidations = useMemo<PaymentBatchApprovedItem[]>(
    () =>
      data?.pages?.flatMap(
        (page: { data?: PaymentBatchApprovedItem[] }) => page?.data || [],
      ) || [],
    [data],
  );

  const { mutate: createPaymentBatch, isPending } =
    useCreatePaymentBatchMutation();

  const columns = useMemo(() => getApprovedItemColumns('LIQUIDATION'), []);
  const selectedIds = Object.keys(rowSelection).filter(
    (id) => rowSelection[id],
  );
  const selectedItems = useMemo(
    () => liquidations.filter((item) => selectedIds.includes(item.id)),
    [liquidations, selectedIds],
  );
  const totalSelectedAmount = selectedItems.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );

  const reset = () => {
    setBankAccountId('');
    setDestinationAccountNumber('');
    setRowSelection({});
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleCreate = () => {
    if (!bankAccountId) {
      toast.error('Debe seleccionar la cuenta bancaria origen');
      return;
    }
    if (destinationAccountNumber.trim().length !== 20) {
      toast.error('La cuenta destino debe tener exactamente 20 dígitos');
      return;
    }
    if (selectedIds.length === 0) {
      toast.error('Debe seleccionar al menos una liquidación especial');
      return;
    }

    createPaymentBatch(
      {
        bankAccountId,
        currencyCode: 'VES',
        destinationAccountNumber: destinationAccountNumber.trim(),
        description: 'Pago especial de liquidaciones',
        items: selectedIds.map((sourceId) => ({
          type: 'LIQUIDATION',
          sourceId,
        })),
      },
      {
        onSuccess: () => {
          toast.success('Lote de pago especial creado exitosamente');
          handleClose();
        },
        onError: (error) => {
          toast.error((error as Error).message || 'Error al crear el lote');
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) handleClose();
      else onOpenChange(true);
    }}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> Pagos Especiales
          </DialogTitle>
          <DialogDescription>
            Seleccione liquidaciones especiales, la cuenta origen y la cuenta
            destino a la que el banco realizará el pago.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Cuenta Bancaria Origen</Label>
              <Select value={bankAccountId} onValueChange={setBankAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione cuenta origen" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account: any) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.accountName} - {account.accountNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Cuenta Destino</Label>
              <Input
                placeholder="Número de cuenta destino (20 dígitos)"
                inputMode="numeric"
                value={destinationAccountNumber}
                onChange={(e) =>
                  setDestinationAccountNumber(
                    e.target.value.replace(/\D/g, '').slice(0, 20),
                  )
                }
              />
              <p className="text-xs text-muted-foreground">
                Debe tener exactamente 20 dígitos. Esta cuenta se usará para
                todos los asociados en el TXT.
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">
                Liquidaciones Especiales Aprobadas
              </span>
              <span className="text-xs text-muted-foreground">
                {liquidations.length} registros
              </span>
            </div>
            <ApprovedItemsDataTable
              columns={columns}
              data={liquidations}
              rowSelection={rowSelection}
              onRowSelectionChange={setRowSelection}
              isLoading={isLoading}
              fetchNextPage={fetchNextPage}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              totalCount={liquidations.length}
            />
          </div>

          <SelectionSummary
            selectedCount={selectedIds.length}
            totalAmount={totalSelectedAmount}
            currencyCode="VES"
            isSubmitting={isPending}
            onProcess={handleCreate}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

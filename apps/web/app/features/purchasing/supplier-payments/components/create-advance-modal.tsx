import { useState } from 'react';
import { Button } from '@repo/shadcn/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/shadcn/dialog';
import { Input } from '@repo/shadcn/input';
import { Label } from '@repo/shadcn/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/shadcn/select';
import { formatCurrency } from '@/lib/format-utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastSystem } from '@/hooks/use-toast-system';
import { supplierPaymentsService } from '../services/supplier-payments-service';
import { useSuppliersAllQuery } from '@/features/purchasing/suppliers/hooks/use-suppliers-queries';
import { useBankAccountAll } from '@/features/banks/bank-account/hooks/use-bank-account-query';
import { AlertModal } from '@/components/shared/alert-modal';
import { PAYMENT_METHOD_LABELS } from '../schemas/supplier-payment-options';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateAdvanceModal({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  const { mutateAsync: createAdvance, isPending } = useMutation({
    mutationFn: supplierPaymentsService.createAdvance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-payments'] as const });
      toastSuccess('Anticipo registrado correctamente');
    },
    onError: (err: unknown) => {
      toastError(err instanceof Error ? err.message : 'Error al registrar anticipo');
    },
  });

  const [supplierId, setSupplierId] = useState('');
  const [amount, setAmount] = useState(0);
  const [bankAccountId, setBankAccountId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [bankReference, setBankReference] = useState('');
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [transactionDate, setTransactionDate] = useState(todayStr);
  const [description, setDescription] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: suppliersData } = useSuppliersAllQuery(open);
  const { data: bankAccountsData } = useBankAccountAll();

  const suppliers = suppliersData ?? [];
  const bankAccounts = bankAccountsData?.data ?? [];

  const handleConfirm = async () => {
    if (!supplierId || amount <= 0 || !bankAccountId) return;

    try {
      await createAdvance({
        supplierId,
        amount,
        bankAccountId,
        paymentMethod,
        paymentDescription: description || 'Anticipo a proveedor',
        bankReference: bankReference || undefined,
        transactionDate,
      });
      setConfirmOpen(false);
      onOpenChange(false);
    } catch {
      // error handled by mutation
    }
  };

  const supplierName = suppliers.find((s: { id: string; name: string }) => s.id === supplierId)?.name;

  return (
    <>
      <AlertModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        loading={isPending}
        title="¿Confirmar anticipo?"
        description={`Se registrará un anticipo de ${formatCurrency(amount, 'VES')}${supplierName ? ` a favor de ${supplierName}` : ''}.`}
      />

      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Anticipo</DialogTitle>
          <DialogDescription>
            Registra un anticipo a favor de un proveedor. Este saldo se podrá aplicar a futuras facturas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Proveedor</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder="Seleccionar proveedor" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s: { id: string; name: string }) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Monto del Anticipo</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>

          <div className="space-y-1">
            <Label>Banco / Cuenta de Salida</Label>
            <Select value={bankAccountId} onValueChange={setBankAccountId}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder="Seleccionar cuenta bancaria" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map((acc: { id: string; accountName: string | null; accountNumber: string }) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.accountName || acc.accountNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Método de Pago</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Fecha</Label>
              <Input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Referencia Bancaria</Label>
            <Input
              placeholder="N° de transferencia (opcional)"
              value={bankReference}
              onChange={(e) => setBankReference(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label>Observación / Descripción</Label>
            <Input
              placeholder="Ej: Adelanto 30% importación"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={() => setConfirmOpen(true)} disabled={isPending || !supplierId || amount <= 0 || !bankAccountId}>
            {isPending
              ? 'Registrando...'
              : `Registrar Anticipo ${amount > 0 ? formatCurrency(amount, 'VES') : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>  );
}

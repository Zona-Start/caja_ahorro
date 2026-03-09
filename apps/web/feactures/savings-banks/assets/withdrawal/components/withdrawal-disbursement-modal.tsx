'use client';

import { useBankAccountAll } from '@/feactures/banks/bank-account/hooks/use-query-bank-account';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import { CustomCalendar } from '@repo/shadcn/components/ui/custom-calendar';
import { SelectSearchable } from '@repo/shadcn/components/ui/select-searchable';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/shadcn/form';
import { Input } from '@repo/shadcn/input';
import { useForm } from 'react-hook-form';
import { useDisburseWithdrawalMutation } from '../hooks/use-withdrawal-mutation';
import {
  disburseWithdrawalSchema,
  DisburseWithdrawalValues,
} from '../schemas/disburse-withdrawal.schema';
import { WithdrawalPaymentApi } from '../schemas/withdrawal-api-response';

interface WithdrawalDisbursementModalProps {
  isOpen: boolean;
  onClose: () => void;
  withdrawal: WithdrawalPaymentApi | null;
}

export function WithdrawalDisbursementModal({
  isOpen,
  onClose,
  withdrawal,
}: WithdrawalDisbursementModalProps) {
  const { data: bankAccounts } = useBankAccountAll();
  const { mutate: disburse, isPending } = useDisburseWithdrawalMutation();

  const form = useForm<DisburseWithdrawalValues>({
    resolver: zodResolver(disburseWithdrawalSchema),
    defaultValues: {
      processedAt: new Date(),
      bankReference: '',
    },
  });

  const onSubmit = (values: DisburseWithdrawalValues) => {
    if (!withdrawal?.id) return;

    disburse(
      {
        id: Number(withdrawal.id),
        payload: values,
      },
      {
        onSuccess: () => {
          form.reset();
          onClose();
        },
      },
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Desembolsar Retiro</DialogTitle>
          <DialogDescription>
            Complete la información para procesar el desembolso del retiro de{' '}
            <span className="font-semibold">{withdrawal?.associateFullname}</span> por un monto de{' '}
            <span className="font-semibold">{withdrawal?.requestedAmount} Bs.</span>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="bankAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuenta Bancaria</FormLabel>
                  <SelectSearchable
                    options={
                      bankAccounts?.data?.map((account: any) => ({
                        value: account.id.toString(),
                        label: `${account.bankDirectoryName} - ${account.accountNumber}`,
                      })) || []
                    }
                    onValueChange={(value) => field.onChange(Number(value))}
                    placeholder="Seleccione una cuenta"
                    defaultValue={field.value?.toString()}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="processedAt"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Transacción</FormLabel>
                  <CustomCalendar
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Seleccione la fecha"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bankReference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referencia Bancaria</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. 12345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Procesando...' : 'Confirmar Desembolso'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

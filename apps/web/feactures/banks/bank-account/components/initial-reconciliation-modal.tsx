'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import { CustomCalendar } from '@repo/shadcn/custom-calendar';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/shadcn/form';
import { Input } from '@repo/shadcn/input';
import { Switch } from '@repo/shadcn/switch';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useInitialReconciliation } from '../hooks/use-mutation-initial-reconciliation';
import { BankAccount } from '../schemas/bank-account.schema';

interface InitialReconciliationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bankAccount: BankAccount;
}

const reconciliationSchema = z.object({
  idAccount: z.number(),
  reconciliationDate: z.date(),
  lastStatementBalance: z.number(),
  lastStatementDate: z.date(),
  createAdjustment: z.boolean(),
});

type ReconciliationFormValues = z.infer<typeof reconciliationSchema>;

export function InitialReconciliationModal({
  open,
  onOpenChange,
  bankAccount,
}: InitialReconciliationModalProps) {
  const { mutate: reconcile, isPending } = useInitialReconciliation();

  const form = useForm<ReconciliationFormValues>({
    resolver: zodResolver(reconciliationSchema),
    defaultValues: {
      idAccount: bankAccount.id!,
      reconciliationDate: new Date(),
      lastStatementBalance: bankAccount.lastStatementBalance || 0,
      lastStatementDate: bankAccount.lastStatementDate || new Date(),
      createAdjustment: false,
    },
  });

  const lastStatementBalanceForm = form.watch('lastStatementBalance');
  const balanceDifference =
    (bankAccount.currentBalance || 0) - lastStatementBalanceForm;
  const showAdjustment = balanceDifference !== 0;

  const onSubmit = (data: ReconciliationFormValues) => {
    reconcile(
      {
        bankAccountId: bankAccount.id!,
        reconciliationDate: data.reconciliationDate,
        lastStatementBalance: data.lastStatementBalance,
        lastStatementDate: data.lastStatementDate,
        createAdjustment: showAdjustment && data.createAdjustment,
      },
      {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
        onError: () => {
          form.setError('root', {
            type: 'manual',
            message: 'Error al crear la conciliación inicial',
          });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conciliación Inicial</DialogTitle>
          <DialogDescription>
            Ajuste los saldos iniciales de la cuenta bancaria.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormItem>
                <FormLabel>Saldo según Libros</FormLabel>
                <Input
                  value={bankAccount.currentBalance?.toFixed(2)}
                  readOnly
                  className="bg-muted"
                />
              </FormItem>
              <FormField
                control={form.control}
                name="lastStatementBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saldo según Extracto</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        defaultValue={field.value.toFixed(2)}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lastStatementDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Último Extracto bancario</FormLabel>
                    <CustomCalendar
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Seleccione una fecha"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reconciliationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Conciliación</FormLabel>
                    <CustomCalendar
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Seleccione una fecha"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormItem>
              <FormLabel>Diferencia</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  value={balanceDifference.toFixed(2)}
                  disabled
                  className="bg-muted"
                />
              </FormControl>
            </FormItem>

            {showAdjustment && (
              <FormField
                control={form.control}
                name="createAdjustment"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Generar Asiento de Ajuste</FormLabel>
                      <FormDescription>
                        Se creará un asiento contable por la diferencia de{' '}
                        {balanceDifference.toFixed(2)}.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Guardando...' : 'Guardar Conciliación'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useAccountingAccounts } from '@/feactures/accounting/accounting-accounts/hooks/use-query-account-plan';
import { useAccountingRules } from '@/feactures/accounting/accounting-rules/hooks/use-query-accounting-rules';
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
import { SelectSearchable } from '@repo/shadcn/select-searchable';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useGenerateOpeningEntry } from '../hooks/use-mutation-generate-opening-entry';
import { BankAccount } from '../schemas/bank-account.schema';

interface GenerateOpeningEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bankAccount: BankAccount;
}

const openingEntrySchema = z.object({
  currentBalance: z
    .number()
    .min(0.01, { message: 'El saldo debe ser mayor a 0' }),
  accountingRuleId: z
    .number()
    .min(1, { message: 'Debe seleccionar una regla' }),
  openingDate: z.date({
    required_error: 'La fecha del asiento es requerida',
  }),
});

type OpeningEntryFormValues = z.infer<typeof openingEntrySchema>;

export function GenerateOpeningEntryModal({
  open,
  onOpenChange,
  bankAccount,
}: GenerateOpeningEntryModalProps) {
  const { mutate: generateEntry, isPending } = useGenerateOpeningEntry();
  // Usamos companyId 1 por defecto ya que no está en el store
  const { data: accountingRules } = useAccountingRules(1);

  const { data: AccoutingAccountsPlans } = useAccountingAccounts();

  const form = useForm<OpeningEntryFormValues>({
    resolver: zodResolver(openingEntrySchema),
    defaultValues: {
      currentBalance: bankAccount.currentBalance || 0,
      accountingRuleId: bankAccount.accountingRuleId || undefined,
      openingDate: bankAccount.openingDate
        ? new Date(bankAccount.openingDate)
        : new Date(),
    },
  });

  const onSubmit = (data: OpeningEntryFormValues) => {
    generateEntry(
      {
        id: bankAccount.id!,
        payload: {
          currentBalance: data.currentBalance,
          accountingRuleId: data.accountingRuleId,
          openingDate: data.openingDate.toISOString(),
        },
      },
      {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generar Asiento de Apertura</DialogTitle>
          <DialogDescription>
            Seleccione la regla contable y verifique el saldo inicial para
            generar el asiento de apertura.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="openingDate"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Fecha del Asiento *</FormLabel>
                  <FormControl>
                    <CustomCalendar
                      value={field.value}
                      onChange={(date) => field.onChange(date)}
                      onBlur={field.onBlur}
                      placeholder="Seleccione la fecha"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currentBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saldo Inicial</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountingRuleId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Regla Contable *</FormLabel>
                  <SelectSearchable
                    options={
                      (accountingRules || [])
                        .filter(
                          (rule: any) =>
                            rule.category === 'BANKING' &&
                            rule.operationType === 'BANK_INITIAL_BALANCE',
                        )
                        .map((rule: any) => {
                          const detail = rule.details?.find(
                            (d: any) =>
                              d.accountRole === 'INITIAL_BALANCE_CAPITAL',
                          );
                          const accountName =
                            AccoutingAccountsPlans?.data?.find(
                              (acc) => acc.id === detail?.accountPlanId,
                            )?.name || 'Sin cuenta';
                          return {
                            value: rule.id!.toString(),
                            label: `${rule.description} (${accountName})`,
                          };
                        }) || []
                    }
                    onValueChange={(value) => field.onChange(Number(value))}
                    placeholder="Seleccione regla contable"
                    defaultValue={field.value?.toString() || ''}
                  />
                  <FormDescription>
                    Seleccione la regla que define la cuenta de contrapartida.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Generando...' : 'Generar Asiento'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

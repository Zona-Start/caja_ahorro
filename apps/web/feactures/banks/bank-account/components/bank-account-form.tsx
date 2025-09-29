'use client';

import { useAccountingAccounts } from '@/feactures/accounting/accounting-accounts/hooks/use-query-account-plan';
import { useBanksQuery } from '@/feactures/banks/bank-directory/hooks/use-banks-querys';
import { useSystemConfigStore } from '@/store/SystemConfigStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import { CustomCalendar } from '@repo/shadcn/custom-calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/shadcn/form';
import { Input } from '@repo/shadcn/input';
import { ScrollArea } from '@repo/shadcn/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { SelectSearchable } from '@repo/shadcn/select-searchable';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useBankAccountMutation } from '../hooks/use-mutation-bank-account';
import { ACCOUNT_TYPES } from '../schemas/bank-account-options';
import { BankAccount, bankAccountSchema } from '../schemas/bank-account.schema';

interface BankAccountFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<BankAccount>;
  readOnly?: boolean;
}

export function BankAccountForm({
  onSuccess,
  onCancel,
  defaultValues,
  readOnly = false,
}: BankAccountFormProps) {
  const { mutate: saveBankAccount, isPending: isSaving } =
    useBankAccountMutation();
  const { data: Banks } = useBanksQuery();
  const { currencies } = useSystemConfigStore();
  const { data: AccoutingAccountsPlans } = useAccountingAccounts();

  const [selectedAccountType, setSelectedAccountType] = useState(
    defaultValues?.accountType || 'CORRIENTE',
  );

  const form = useForm<BankAccount>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      id: defaultValues?.id,
      companyId: defaultValues?.companyId || 1,
      bankDirectoryId: defaultValues?.bankDirectoryId,
      accountNumber: defaultValues?.accountNumber || '',
      accountName: defaultValues?.accountName || '',
      accountType: defaultValues?.accountType || 'CORRIENTE',
      currencyCode: defaultValues?.currencyCode || '1',
      openingDate: defaultValues?.openingDate
        ? defaultValues?.openingDate
        : undefined,
      currentBalance: Number(defaultValues?.currentBalance) || 0.0,
      lastStatementBalance: Number(defaultValues?.lastStatementBalance) || 0.0,
      lastStatementDate: defaultValues?.lastStatementDate
        ? defaultValues?.lastStatementDate
        : undefined,
      linkedChartAccountId: defaultValues?.linkedChartAccountId,
      isActive: defaultValues?.isActive ?? true,
    },
    mode: 'onChange', // Enable real-time validation
  });

  const onSubmit = async (data: BankAccount) => {
    saveBankAccount(data, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
      onError: () => {
        form.setError('root', {
          type: 'manual',
          message: 'Error al guardar la cuenta bancaria',
        });
      },
    });
  };

  return (
    <Form {...form}>
      <ScrollArea className="h-[calc(100vh-200px)]">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4  h-full"
        >
          {form.formState.errors.root && (
            <div className="text-destructive text-sm">
              {form.formState.errors.root.message}
            </div>
          )}
          <div className="grid grid-cols-1  gap-4">
            <FormField
              control={form.control}
              name="bankDirectoryId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Banco</FormLabel>
                  <SelectSearchable
                    options={
                      Banks?.data?.map((item) => ({
                        value: item.id!.toString(),
                        label: `${item.code} - ${item.name}`,
                      })) || []
                    }
                    onValueChange={(value) => field.onChange(Number(value))}
                    placeholder="Selecciona un banco"
                    defaultValue={String(field.value)}
                    disabled={readOnly}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de cuenta</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={readOnly}
                      className={readOnly ? 'bg-muted' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Cuenta</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={readOnly}
                      className={readOnly ? 'bg-muted' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountType"
              render={({ field }) => (
                <FormItem className=" w-full">
                  <FormLabel>Tipo Cuenta</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      setSelectedAccountType(value);
                      field.onChange(value); // Asignar el valor seleccionado directamente al campo `group`
                    }}
                    value={selectedAccountType}
                    disabled={readOnly}
                  >
                    <SelectTrigger
                      className={readOnly ? 'bg-muted w-full' : 'w-full'}
                    >
                      <SelectValue placeholder="Seleccione un grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ACCOUNT_TYPES).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currencyCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Moneda</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) => field.onChange(value)}
                      value={field.value}
                      disabled={readOnly}
                    >
                      <SelectTrigger
                        className={readOnly ? 'bg-muted w-full' : 'w-full'}
                      >
                        <SelectValue placeholder="Seleccione una moneda" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem
                            key={currency.id}
                            value={currency.id.toString()}
                          >
                            {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="openingDate"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Fecha Apertura</FormLabel>
                  <FormControl>
                    <CustomCalendar
                      value={field.value}
                      onChange={(date) => field.onChange(date)}
                      onBlur={field.onBlur}
                      placeholder="Seleccione la fecha"
                      disabled={readOnly}
                      className={readOnly ? 'bg-muted' : ''}
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
                  <FormLabel>Saldo según libros</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      disabled={readOnly}
                      className={readOnly ? 'bg-muted' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastStatementBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saldo Último Extracto bancario</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      disabled={readOnly}
                      className={readOnly ? 'bg-muted' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastStatementDate"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Fecha Último Extracto bancario</FormLabel>
                  <FormControl>
                    <CustomCalendar
                      value={field.value}
                      onChange={(date) => field.onChange(date)}
                      onBlur={field.onBlur}
                      placeholder="Seleccione la fecha"
                      disabled={readOnly}
                      className={readOnly ? 'bg-muted' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="linkedChartAccountId"
              render={({ field }) => (
                <FormItem className="col-span-2 w-full">
                  <FormLabel>Cuenta Contable</FormLabel>
                  <SelectSearchable
                    options={
                      AccoutingAccountsPlans?.data?.map((account) => ({
                        value: account.id!.toString(),
                        label: `${account.code} - ${account.name}`,
                      })) || []
                    }
                    onValueChange={(value) =>
                      field.onChange(value === 'null' ? null : Number(value))
                    }
                    placeholder="Selecciona cuenta contable"
                    defaultValue={field.value?.toString() || 'null'}
                    disabled={readOnly}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Estado</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === 'true')}
                    defaultValue={String(field.value)}
                    disabled={readOnly}
                  >
                    <FormControl>
                      <SelectTrigger
                        className={readOnly ? 'bg-muted w-full' : 'w-full'}
                      >
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-full min-w-[200px]">
                      <SelectItem value="true">Activa</SelectItem>
                      <SelectItem value="false">Inactiva</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="sticky bottom-0 w-full bg-background  py-2 px-6 mt-auto">
            <div className="flex justify-end gap-4">
              <Button variant="outline" type="button" onClick={onCancel}>
                {readOnly ? 'Cerrar' : 'Cancelar'}
              </Button>
              {!readOnly && (
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </ScrollArea>
    </Form>
  );
}

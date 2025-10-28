'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/shadcn/form';
import { Input } from '@repo/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { SelectSearchable } from '@repo/shadcn/select-searchable';
import { useForm } from 'react-hook-form';
import { useAccountingAccounts } from '../../accounting-accounts/hooks/use-query-account-plan';
import { useAccountingConfigurationMutation } from '../hooks/use-accounting-configuration-mutation';
import {
  AccountingConfiguration,
  accountingConfigurationSchema,
} from '../schemas/accounting-configuration.schema';

interface AccountingConfigurationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<AccountingConfiguration>;
}

export function AccountingConfigurationForm({
  onSuccess,
  onCancel,
  defaultValues,
}: AccountingConfigurationFormProps) {
  const { mutate: saveAccountingConfiguration, isPending: isSaving } =
    useAccountingConfigurationMutation();

  const { data: accountingAccounts } = useAccountingAccounts();

  const form = useForm<AccountingConfiguration>({
    resolver: zodResolver(accountingConfigurationSchema),
    defaultValues: {
      id: defaultValues?.id,
      companyId: defaultValues?.companyId || 1,
      operationType: defaultValues?.operationType || '',
      descriptionTemplate: defaultValues?.descriptionTemplate || '',
      debitAccountId: defaultValues?.debitAccountId || null,
      creditAccountId: defaultValues?.creditAccountId || null,
      contraAccountId: defaultValues?.contraAccountId || null,
      isActive: defaultValues?.isActive || true,
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: AccountingConfiguration) => {
    saveAccountingConfiguration(data, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
      onError: () => {
        form.setError('root', {
          type: 'manual',
          message: 'Error al guardar la configuración contable',
        });
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {form.formState.errors.root && (
          <div className="text-destructive text-sm">
            {form.formState.errors.root.message}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="operationType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Operación</FormLabel>
                <FormControl>
                  <Input placeholder="LOAN_DISBURSEMENT_VES" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="descriptionTemplate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plantilla de Descripción</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Desembolso Préstamo #{loanId}"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="debitAccountId"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Cuenta de Débito</FormLabel>
                {accountingAccounts?.data && (
                  <SelectSearchable
                    options={accountingAccounts.data.map((account) => ({
                      value: account.id!.toString(),
                      label: `${account.code} - ${account.name}`,
                    }))}
                    onValueChange={(value) =>
                      field.onChange(value === 'null' ? null : Number(value))
                    }
                    placeholder="Selecciona una cuenta"
                    defaultValue={field.value?.toString() || 'null'}
                  />
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="creditAccountId"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Cuenta de Crédito</FormLabel>
                {accountingAccounts?.data && (
                  <SelectSearchable
                    options={accountingAccounts.data.map((account) => ({
                      value: account.id!.toString(),
                      label: `${account.code} - ${account.name}`,
                    }))}
                    onValueChange={(value) =>
                      field.onChange(value === 'null' ? null : Number(value))
                    }
                    placeholder="Selecciona una cuenta"
                    defaultValue={field.value?.toString() || 'null'}
                  />
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contraAccountId"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Contra Cuenta</FormLabel>
                {accountingAccounts?.data && (
                  <SelectSearchable
                    options={accountingAccounts.data.map((account) => ({
                      value: account.id!.toString(),
                      label: `${account.code} - ${account.name}`,
                    }))}
                    onValueChange={(value) =>
                      field.onChange(value === 'null' ? null : Number(value))
                    }
                    placeholder="Selecciona una cuenta"
                    defaultValue={field.value?.toString() || 'null'}
                  />
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Estatus</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === 'true')}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona opción" />
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

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

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
import { Switch } from '@repo/shadcn/switch';
import { Separator } from '@repo/shadcn/separator';
import { SelectSearchable } from '@repo/shadcn/select-searchable';
import { useForm } from 'react-hook-form';
import { useBanksQuery } from '../../bank-directory/hooks/use-banks-querys';
import { useAccountingAccounts } from '@/features/accounting/accounting-accounts/hooks/use-accounting-accounts-query';
import {
  useCreateBankAccountMutation,
  useUpdateBankAccountMutation,
} from '../hooks/use-bank-account-query';
import {
  ACCOUNT_TYPE_OPTIONS,
  CURRENCY_CODE_OPTIONS,
} from '../schemas/bank-account-options';
import {
  bankAccountFormSchema,
  type BankAccountForm,
} from '../schemas/bank-account.schema';

interface BankAccountFormComponentProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<BankAccountForm & { id?: string; openingEntryPosted?: boolean }>;
  disabled?: boolean;
}

function toFormValues(data: Partial<BankAccountForm & { id?: string }> | undefined): BankAccountForm {
  return {
    bankDirectoryId: (data?.bankDirectoryId as string) ?? undefined,
    accountName: (data?.accountName as string) || '',
    accountNumber: (data?.accountNumber as string) || '',
    accountType: data?.accountType ?? undefined,
    currencyCode: data?.currencyCode ?? undefined,
    openingDate: data?.openingDate
      ? new Date(data.openingDate as unknown as string)
      : new Date(),
    currentBalance: (data?.currentBalance as number) ?? undefined,
    linkedChartAccountId: (data?.linkedChartAccountId as string) ?? null,
    isActive: (data?.isActive as boolean) ?? true,
  } as BankAccountForm;
}

export function BankAccountForm({
  onSuccess,
  onCancel,
  defaultValues,
  disabled = false,
}: BankAccountFormComponentProps) {
  const createMutation = useCreateBankAccountMutation();
  const updateMutation = useUpdateBankAccountMutation();
  const { data: banksData } = useBanksQuery();
  const { data: accountingAccounts } = useAccountingAccounts();

  const recordId = defaultValues?.id as string | undefined;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<BankAccountForm>({
    resolver: zodResolver(bankAccountFormSchema),
    defaultValues: toFormValues(defaultValues),
    mode: 'onBlur',
  });

  const onSubmit = (formData: BankAccountForm) => {
    if (recordId) {
      updateMutation.mutate(
        { id: recordId, data: formData },
        {
          onSuccess: () => {
            form.reset();
            onSuccess?.();
          },
        },
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          form.reset();
          onSuccess?.();
        },
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Sección 1: Datos de la Cuenta Bancaria */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Datos de la Cuenta Bancaria
          </h3>

          <FormField
            control={form.control}
            name="bankDirectoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Banco</FormLabel>
                <FormControl>
                  <SelectSearchable
                    options={(banksData?.data || [])
                      .filter((b) => b.id != null)
                      .map((bank) => ({
                        value: bank.id!.toString(),
                        label: bank.name!,
                      }))}
                    onValueChange={field.onChange}
                    placeholder="Buscar banco..."
                    value={field.value || undefined}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accountNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Cuenta</FormLabel>
                <FormControl>
                  <Input
                    placeholder="00000000000000000000"
                    inputMode="numeric"
                    maxLength={20}
                    {...field}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 20);
                      field.onChange(val);
                    }}
                    disabled={disabled}
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
                    placeholder="Ej: Cuenta Principal BOD"
                    {...field}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="accountType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Cuenta</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ''}
                    disabled={disabled}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(ACCOUNT_TYPE_OPTIONS).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ),
                      )}
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
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ''}
                    disabled={disabled}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una moneda" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(CURRENCY_CODE_OPTIONS).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="openingDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Apertura</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={
                        field.value instanceof Date
                          ? field.value.toISOString().split('T')[0]
                          : field.value || ''
                      }
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? new Date(e.target.value) : undefined,
                        )
                      }
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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
                    min="0"
                    placeholder="0.00"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseFloat(e.target.value) : undefined,
                      )
                    }
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Cuenta Activa</FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value ?? true}
                    onCheckedChange={field.onChange}
                    disabled={disabled}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Sección 2: Información Contable (Referencia) */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Cuenta Contable de Referencia
          </h3>

          <FormField
            control={form.control}
            name="linkedChartAccountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cuenta Contable Vinculada</FormLabel>
                <FormControl>
                  <SelectSearchable
                    options={
                      (accountingAccounts || [])
                        .filter((a) => a.allowsMovements)
                        .map((acc) => ({
                          value: acc.id!,
                          label: `${acc.code} - ${acc.name}`,
                        }))
                    }
                    onValueChange={field.onChange}
                    placeholder="Buscar cuenta contable..."
                    value={field.value ?? undefined}
                    disabled={disabled}
                    enableNoneOption
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <p className="text-xs text-muted-foreground">
            La cuenta contable se guarda solo como referencia. No se genera ningún asiento contable.
          </p>
        </div>

        <Separator />

        {/* Botones */}
        {disabled ? (
          <div className="flex justify-end">
            <Button type="button" onClick={onCancel}>
              Cerrar
            </Button>
          </div>
        ) : (
          <div className="flex justify-end gap-4 pt-2">
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : recordId ? 'Actualizar' : 'Crear Cuenta'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}

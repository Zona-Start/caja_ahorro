import { zodResolver } from '@hookform/resolvers/zod';
import { useBankAccountAll } from '@/features/banks/bank-account/hooks/use-bank-account-query';
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
import { Textarea } from '@repo/shadcn/textarea';
import { useForm } from 'react-hook-form';
import { useSaveBankMovementMutation } from '../hooks/use-bank-movements-query';
import {
  PAYMENT_METHOD_OPTIONS,
  CATEGORY_OPTIONS,
} from '../schemas/bank-movement-options';
import {
  bankMovementFormSchema,
  type BankMovement,
  type BankMovementForm,
} from '../schemas/bank-movement.schema';

interface BankMovementFormComponentProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<BankMovement>;
  disabled?: boolean;
}

export function BankMovementForm({
  onSuccess,
  onCancel,
  defaultValues,
  disabled = false,
}: BankMovementFormComponentProps) {
  const { mutate: saveMovement, isPending: isSaving } =
    useSaveBankMovementMutation();
  const { data: accountsData } = useBankAccountAll();

  const form = useForm<BankMovementForm>({
    resolver: zodResolver(bankMovementFormSchema),
    defaultValues: {
      bankAccountId: defaultValues?.bankAccountId ?? undefined,
      transactionDate: defaultValues?.transactionDate
        ? new Date(defaultValues.transactionDate)
        : new Date(),
      paymentMethod: defaultValues?.paymentMethod ?? undefined,
      description: defaultValues?.description || '',
      category: defaultValues?.category ?? undefined,
      creditAmount: defaultValues?.creditAmount ?? undefined,
      debitAmount: defaultValues?.debitAmount ?? undefined,
      bankReference: defaultValues?.bankReference ?? '',
      note: defaultValues?.note ?? '',
    },
    mode: 'onChange',
  });

  const onSubmit = async (formData: BankMovementForm) => {
    saveMovement(
      { ...formData, id: defaultValues?.id },
      {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="bankAccountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cuenta Bancaria</FormLabel>
              <Select
                onValueChange={(v) => field.onChange(Number(v))}
                value={field.value?.toString() || ''}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una cuenta" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(accountsData?.data || []).map(
                    (account: {
                      id: number;
                      accountName: string;
                      accountNumber: string;
                    }) => (
                      <SelectItem
                        key={account.id}
                        value={account.id.toString()}
                      >
                        {account.accountName} - {account.accountNumber}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="transactionDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Transacción</FormLabel>
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
                        e.target.value
                          ? new Date(e.target.value)
                          : undefined,
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
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Método de Pago</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ''}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un método" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(PAYMENT_METHOD_OPTIONS).map(
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
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Pago de proveedor"
                  {...field}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || ''}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(CATEGORY_OPTIONS).map(
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="creditAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto Crédito</FormLabel>
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
                        e.target.value
                          ? parseFloat(e.target.value)
                          : undefined,
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
            name="debitAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto Débito</FormLabel>
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
                        e.target.value
                          ? parseFloat(e.target.value)
                          : undefined,
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="bankReference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Referencia Bancaria</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: REF-001"
                    {...field}
                    value={field.value ?? ''}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nota</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Nota adicional..."
                    {...field}
                    value={field.value ?? ''}
                    disabled={disabled}
                    rows={2}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {disabled ? (
          <div className="flex justify-end">
            <Button type="button" onClick={onCancel}>
              Cerrar
            </Button>
          </div>
        ) : (
          <div className="flex justify-end gap-4 pt-4">
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}

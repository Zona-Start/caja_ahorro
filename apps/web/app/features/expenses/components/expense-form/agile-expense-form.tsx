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
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  useActiveSession,
  useCashRegistersAll,
} from '../../hooks/use-cash-register-queries';
import { useExpenseCategories } from '../../hooks/use-expense-categories-query';
import { useCreateExpenseMutation } from '../../hooks/use-expense-queries';
import {
  expenseFormSchema,
  type ExpenseForm,
} from '../../schemas/expenses.schema';

interface AgileExpenseFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AgileExpenseForm({
  onSuccess,
  onCancel,
}: AgileExpenseFormProps) {
  const createMutation = useCreateExpenseMutation();
  const { data: categoriesData } = useExpenseCategories();
  const { data: registersData } = useCashRegistersAll();

  const [selectedRegisterId, setSelectedRegisterId] = useState('');

  const form = useForm<ExpenseForm>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      paymentSource: 'CASH_REGISTER',
      currencyCode: 'VES',
      exchangeRate: 1,
      taxAmountBase: 0,
      overrideBudget: false,
      description: '',
      amount: undefined as unknown as number,
    },
    mode: 'onBlur',
  });

  const { data: activeSessionData, isLoading: sessionLoading } =
    useActiveSession(selectedRegisterId, !!selectedRegisterId);

  useEffect(() => {
    const session = activeSessionData?.data?.session;
    if (session) {
      form.setValue('cashRegisterSessionId', session.id, {
        shouldValidate: true,
      });
    } else {
      form.setValue('cashRegisterSessionId', undefined);
    }
  }, [activeSessionData, form]);

  const registerOptions = (registersData?.data || []).filter((r) => r.isActive);
  const session = activeSessionData?.data?.session;

  const onSubmit = (data: ExpenseForm) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la categoría" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(categoriesData?.data || []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
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
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monto</FormLabel>
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
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Input placeholder="¿En qué se gastó?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel>Caja POS activa</FormLabel>
          <div className="rounded-lg border p-3 space-y-2">
            {registerOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay cajas POS activas. Configúralas en el módulo de Cajas.
              </p>
            ) : (
              <Select
                onValueChange={(value) => {
                  setSelectedRegisterId(value);
                  form.setValue('cashRegisterSessionId', undefined);
                }}
                value={selectedRegisterId || ''}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una caja POS" />
                </SelectTrigger>
                <SelectContent>
                  {registerOptions.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {selectedRegisterId && (
              <div className="text-sm">
                {sessionLoading ? (
                  <p className="text-muted-foreground">Consultando sesión...</p>
                ) : session ? (
                  <p className="text-green-600">
                    Sesión abierta · Saldo esperado:{' '}
                    {Number(session.systemExpectedBalance).toFixed(2)}
                  </p>
                ) : (
                  <p className="text-amber-600">
                    No hay una sesión de caja abierta para esta caja POS.
                  </p>
                )}
              </div>
            )}
          </div>
          <FormMessage>
            {form.formState.errors.cashRegisterSessionId?.message}
          </FormMessage>
        </div>

        <div className="flex justify-end gap-4 pt-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createMutation.isPending || !session}>
            {createMutation.isPending ? 'Registrando...' : 'Registrar Gasto'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

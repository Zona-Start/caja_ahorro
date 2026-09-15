import { useBankAccountAll } from '@/features/banks/bank-account/hooks/use-bank-account-query';
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
import { Progress } from '@repo/shadcn/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/shadcn/tabs';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  useActiveSession,
  useCashRegistersAll,
} from '../../hooks/use-cash-register-queries';
import {
  useCostCenterBudgetUsage,
  useCostCentersAll,
} from '../../hooks/use-cost-center-queries';
import { useExpenseCategories } from '../../hooks/use-expense-categories-query';
import { useCreateExpenseMutation } from '../../hooks/use-expense-queries';
import { usePettyCashAll } from '../../hooks/use-petty-cash-queries';
import {
  EXPENSE_TYPE_OPTIONS,
  PAYMENT_SOURCE_OPTIONS,
  expenseFormSchema,
  type ExpenseForm,
} from '../../schemas/expenses.schema';

interface CorporateExpenseFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CorporateExpenseForm({
  onSuccess,
  onCancel,
}: CorporateExpenseFormProps) {
  const createMutation = useCreateExpenseMutation();
  const { data: categoriesData } = useExpenseCategories();
  const { data: registersData } = useCashRegistersAll();
  const { data: costCentersData } = useCostCentersAll();
  const { data: pettyCashData } = usePettyCashAll();
  const { data: bankAccountsData } = useBankAccountAll();

  const [selectedRegisterId, setSelectedRegisterId] = useState('');
  const { data: activeSessionData } = useActiveSession(
    selectedRegisterId,
    !!selectedRegisterId,
  );

  const form = useForm<ExpenseForm>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      paymentSource: 'CASH_REGISTER',
      currencyCode: 'VES',
      exchangeRate: 1,
      taxAmountBase: 0,
      overrideBudget: false,
      type: 'FORMAL_INVOICE',
      description: '',
      amount: undefined as unknown as number,
    },
    mode: 'onBlur',
  });

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

  const paymentSource = form.watch('paymentSource');
  const costCenterId = form.watch('costCenterId');

  const { data: budgetUsage } = useCostCenterBudgetUsage(
    costCenterId || '',
    undefined,
    !!costCenterId,
  );

  const onSubmit = (data: ExpenseForm) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
    });
  };

  const registerOptions = (registersData?.data || []).filter((r) => r.isActive);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <Tabs defaultValue="supplier" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="supplier">Proveedor</TabsTrigger>
            <TabsTrigger value="fiscal">Desglose Fiscal</TabsTrigger>
            <TabsTrigger value="cost">Centro de Costo</TabsTrigger>
            <TabsTrigger value="receipt">Comprobante</TabsTrigger>
          </TabsList>

          <TabsContent value="supplier" className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Gasto</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(EXPENSE_TYPE_OPTIONS).map(
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
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría de Gasto</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ''}
                  >
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

            <div className="rounded-lg border p-3 text-sm text-muted-foreground">
              Puedes vincular un proveedor registrado en el módulo de Compras.
              Para gastos express, registra la descripción del beneficiario.
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Input placeholder="Descripción del gasto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="fiscal" className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto Base</FormLabel>
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currencyCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moneda</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Moneda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="VES">VES</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="exchangeRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tasa de Cambio</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.000001"
                        min="0"
                        placeholder="1.000000"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="taxAmountBase"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IVA (Base Imponible)</FormLabel>
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
                          e.target.value ? parseFloat(e.target.value) : 0,
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-lg border p-3 text-sm text-muted-foreground">
              Las retenciones de IVA e ISLR se calculan automáticamente según la
              configuración del tenant al registrar el gasto.
            </div>
          </TabsContent>

          <TabsContent value="cost" className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="costCenterId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Centro de Costo</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el centro de costo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(costCentersData?.data || []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.code} - {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {budgetUsage && (
              <div className="rounded-lg border p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Presupuesto mensual
                  </span>
                  <span className="font-medium">
                    {budgetUsage.data.budget != null
                      ? `${budgetUsage.data.used.toFixed(2)} / ${budgetUsage.data.budget.toFixed(2)}`
                      : 'Sin presupuesto definido'}
                  </span>
                </div>
                {budgetUsage.data.budget != null && (
                  <>
                    <Progress
                      value={Math.min(budgetUsage.data.percentage ?? 0, 100)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {budgetUsage.data.percentage ?? 0}% del presupuesto
                      consumido este mes
                    </p>
                  </>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="receipt" className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="receiptNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>N° de Comprobante</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: 001234"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="receiptImageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comprobante digital (URL)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://..."
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value || undefined)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        <div className="rounded-lg border p-3 space-y-3">
          <FormLabel>Fuente del dinero</FormLabel>
          <Select
            onValueChange={(value) =>
              form.setValue(
                'paymentSource',
                value as ExpenseForm['paymentSource'],
                {
                  shouldValidate: true,
                },
              )
            }
            value={paymentSource}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona la fuente" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PAYMENT_SOURCE_OPTIONS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {paymentSource === 'CASH_REGISTER' && (
            <div className="space-y-2">
              <FormLabel>Caja POS</FormLabel>
              <Select
                onValueChange={(value) => {
                  setSelectedRegisterId(value);
                  form.setValue('cashRegisterSessionId', undefined);
                }}
                value={selectedRegisterId || ''}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la caja" />
                </SelectTrigger>
                <SelectContent>
                  {registerOptions.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedRegisterId &&
                (activeSessionData?.data?.session ? (
                  <p className="text-xs text-green-600">
                    Sesión abierta · Saldo esperado:{' '}
                    {Number(
                      activeSessionData.data.session.systemExpectedBalance,
                    ).toFixed(2)}
                  </p>
                ) : (
                  <p className="text-xs text-amber-600">
                    No hay una sesión de caja abierta para esta caja POS.
                  </p>
                ))}
              <FormMessage>
                {form.formState.errors.cashRegisterSessionId?.message}
              </FormMessage>
            </div>
          )}

          {paymentSource === 'BANK_ACCOUNT' && (
            <FormField
              control={form.control}
              name="bankAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuenta Bancaria</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona la cuenta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(bankAccountsData?.data || []).map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.accountName || a.accountNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {paymentSource === 'PETTY_CASH' && (
            <FormField
              control={form.control}
              name="pettyCashFundId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fondo Fijo</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el fondo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(pettyCashData?.data || []).map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormMessage>
            {form.formState.errors.paymentSource?.message}
          </FormMessage>
        </div>

        <div className="flex justify-end gap-4 pt-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Registrando...' : 'Registrar Gasto'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

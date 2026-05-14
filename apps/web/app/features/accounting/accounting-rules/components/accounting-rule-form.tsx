import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
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
import { Separator } from '@repo/shadcn/separator';
import { Switch } from '@repo/shadcn/switch';
import { Plus, Trash } from 'lucide-react';
import { useMemo } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useAccountingAccounts } from '../../accounting-accounts/hooks/use-accounting-accounts-query';
import { useAllAccountingRules } from '../hooks/use-all-accounting-rules';
import { useAccountingRuleMutation } from '../hooks/use-accounting-rules-mutation';
import { useAccountingRulesParams } from '../hooks/use-accounting-rules-params';
import { useWithdrawalTypesQuery } from '@/features/savings/withdrawals/withdrawal-types/hooks/use-withdrawal-types-query';
import { useLoanTypesQuery } from '@/features/savings/loans/type-loans/hooks/use-type-loans-query';
import { useCreditTypesQuery } from '@/features/savings/credits/type-credits/hooks/use-credit-types-query';
import { useCategoriesByTypeQuery } from '@/features/core/categories/hooks/use-categories-queries';
import {
  categoryTranslations,
  getOperationDef,
  operationsByCategory,
  operationTypeTranslations,
  roleOptionsByCategory,
  type Category,
} from '../constants/operations';
import type { AccountPlan } from '../../accounting-accounts/schemas/account-plan.schema';
import {
  type AccountingRule,
  accountingRuleSchema,
} from '../schemas/accounting-rule.schema';

interface AccountingRuleFormProps {
  category?: Category;
  operationType?: string;
  reference?: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<AccountingRule>;
  readOnly?: boolean;
}

export function AccountingRuleForm({
  category: propCategory,
  operationType: propOperationType,
  reference: propReference,
  onSuccess,
  onCancel,
  defaultValues,
  readOnly = false,
}: AccountingRuleFormProps) {
  const { category: urlCategory, operation: urlOperation, reference: urlReference } =
    useAccountingRulesParams();

  const category = (propCategory ?? urlCategory) as Category;
  const operationType = propOperationType ?? urlOperation;
  const reference = propReference ?? urlReference;

  const isPageMode = !!propCategory && !!propOperationType;

  const opDef = operationType ? getOperationDef(operationType) : undefined;

  const { mutate: saveAccountingRule, isPending: isSaving } =
    useAccountingRuleMutation();
  const { data: allRules } = useAllAccountingRules();
  const { data: accountingAccounts, isLoading: isLoadingAccounts } =
    useAccountingAccounts();

  const { data: withdrawalTypes } = useWithdrawalTypesQuery(
    { page: 1, limit: 100, sortBy: 'id', sortOrder: 'asc' },
    operationType === 'WITHDRAWAL_TYPE' && !!reference,
  );
  const { data: loanTypes } = useLoanTypesQuery(
    { page: 1, limit: 100, sortBy: 'id', sortOrder: 'asc' },
    operationType === 'LOAN_TYPE' && !!reference,
  );
  const { data: creditTypes } = useCreditTypesQuery(
    { page: 1, limit: 100, sortBy: 'id', sortOrder: 'asc' },
    operationType === 'CREDIT_TYPE' && !!reference,
  );
  const { data: payrollTypes } = useCategoriesByTypeQuery(
    'payroll_type',
    operationType === 'PAYROLL_CONCEPT' && !!reference,
  );

  const referenceLabel = useMemo(() => {
    if (!reference || !opDef?.isDynamic) return null;
    if (operationType === 'WITHDRAWAL_TYPE') {
      const found = withdrawalTypes?.data?.find(
        (w: { id: string; description: string }) => w.id === reference,
      );
      return found?.description ?? reference;
    }
    if (operationType === 'LOAN_TYPE') {
      const found = loanTypes?.data?.find(
        (l: { id: number; name: string }) => String(l.id) === reference,
      );
      return found?.name ?? reference;
    }
    if (operationType === 'CREDIT_TYPE') {
      const found = creditTypes?.data?.find(
        (c: { id: number; name: string }) => String(c.id) === reference,
      );
      return found?.name ?? reference;
    }
    if (operationType === 'PAYROLL_CONCEPT') {
      const found = payrollTypes?.find(
        (p: { id: string; name: string }) => p.id === reference,
      );
      return found?.name ?? reference;
    }
    return reference;
  }, [reference, operationType, opDef, withdrawalTypes, loanTypes, creditTypes, payrollTypes]);

  const existingRule = useMemo(() => {
    if (defaultValues?.id) return defaultValues as AccountingRule;
    if (!allRules || !operationType) return undefined;

    if (opDef?.isDynamic && reference) {
      return allRules.find(
        (r) =>
          r.category === category &&
          r.operationType === operationType &&
          r.referenceValue === reference,
      );
    }

    return allRules.find(
      (r) =>
        r.category === category &&
        r.operationType === operationType &&
        !r.referenceValue,
    );
  }, [allRules, category, operationType, reference, opDef, defaultValues]);

  const isEdit = !!existingRule?.id;

  const form = useForm<AccountingRule>({
    resolver: zodResolver(accountingRuleSchema),
    defaultValues: (existingRule
      ? {
          id: existingRule.id,
          tenantId: existingRule.tenantId ?? '',
          category: existingRule.category,
          operationType: existingRule.operationType,
          description: existingRule.description ?? '',
          referenceValue: existingRule.referenceValue ?? null,
          isActive: existingRule.isActive ?? true,
          details:
            existingRule.details?.map((d) => ({
              ...d,
              isAuxiliary: d.isAuxiliary ?? false,
              isAuxiliarySupplier: d.isAuxiliarySupplier ?? false,
            })) || [],
        }
      : {
          tenantId: '',
          category,
          operationType,
          description: '',
          referenceValue: reference ?? null,
          isActive: true,
          details: [],
        }) as AccountingRule,
    mode: 'onChange',
  });

  const selectedCategory = useWatch({ control: form.control, name: 'category' });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'details',
  });

  const operationOptions = useMemo(
    () => operationsByCategory[selectedCategory] || [],
    [selectedCategory],
  );

  const roleOptions = useMemo(
    () => roleOptionsByCategory[selectedCategory] || [],
    [selectedCategory],
  );

  const operationLabel =
    operationTypeTranslations[operationType] || operationType;
  const categoryLabel = categoryTranslations[category];

  const headerTitle = referenceLabel
    ? `${operationLabel} › ${referenceLabel}`
    : operationLabel;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => {
          const payload: AccountingRule = {
            ...data,
            referenceValue: reference ?? data.referenceValue ?? null,
            tenantId: data.tenantId || '',
          };
          saveAccountingRule(payload, {
            onSuccess: () => {
              form.reset(payload);
              onSuccess?.();
            },
          });
        })}
        className="flex flex-col h-full"
        key={`${category}-${operationType}-${reference ?? 'static'}-${existingRule?.id ?? 'new'}`}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div>
            <h3 className="text-lg font-semibold">
              {readOnly
                ? 'Ver Regla Contable'
                : isEdit
                  ? 'Editar Regla Contable'
                  : 'Configurando: ' + headerTitle}
            </h3>
            <p className="text-sm text-muted-foreground">
              {categoryLabel}
            </p>
          </div>
          {readOnly ? (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cerrar
            </Button>
          ) : (
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          )}
        </div>

        <Separator />

        <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={readOnly || isPageMode}
                  >
                    <FormControl>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SAVINGS_BANK">
                        Caja de Ahorro
                      </SelectItem>
                      <SelectItem value="ADMINISTRATIVE">
                        Administrativa
                      </SelectItem>
                      <SelectItem value="BANKING">Bancaria</SelectItem>
                      <SelectItem value="ACCOUNTING">Contable</SelectItem>
                      <SelectItem value="INVENTORY">Inventario</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="operationType"
              render={({ field }) => (
                <FormItem>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={readOnly || isPageMode}
                  >
                    <FormControl>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Operación" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {operationOptions.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
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
              name="description"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormControl>
                    <Input
                      placeholder="Descripción de la regla"
                      className="h-9"
                      {...field}
                      value={field.value || ''}
                      disabled={readOnly}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Detalles / Movimientos</h4>
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                append({
                  movementType: 'DEBIT',
                  accountRole: '',
                  formula: '',
                  accountPlanId: null as string | null,
                  isAuxiliary: false,
                  isAuxiliarySupplier: false,
                })
                }
              >
                <Plus className="mr-1 h-4 w-4" />
                Agregar Detalle
              </Button>
            )}
          </div>

          {fields.length > 0 ? (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground w-[100px]">
                      Tipo
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                      Rol de Cuenta
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                      Cuenta Específica
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-muted-foreground w-[80px]">
                      Aux. Socio
                    </th>
                    <th className="px-3 py-2 w-[40px]" />
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => (
                    <tr
                      key={field.id}
                      className="border-b last:border-b-0 hover:bg-muted/30"
                    >
                      <td className="px-3 py-1.5">
                        <FormField
                          control={form.control}
                          name={`details.${index}.movementType`}
                          render={({ field: f }) => (
                            <FormItem>
                              <Select
                                onValueChange={f.onChange}
                                defaultValue={f.value}
                                disabled={readOnly}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-8 border-0 bg-transparent px-0 shadow-none focus:ring-0">
                                    <SelectValue placeholder="Tipo" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="DEBIT">DÉBITO</SelectItem>
                                  <SelectItem value="CREDIT">CRÉDITO</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <FormField
                          control={form.control}
                          name={`details.${index}.accountRole`}
                          render={({ field: f }) => (
                            <FormItem>
                              <Select
                                onValueChange={f.onChange}
                                value={f.value || ''}
                                disabled={readOnly}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-8 border-0 bg-transparent px-0 shadow-none focus:ring-0">
                                    <SelectValue placeholder="Seleccione Rol" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {roleOptions.map((role) => (
                                    <SelectItem
                                      key={role.value}
                                      value={role.value}
                                    >
                                      {role.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <FormField
                          control={form.control}
                          name={`details.${index}.accountPlanId`}
                          render={({ field: f }) => (
                            <FormItem>
                              <FormControl>
                                {isLoadingAccounts ? (
                                  <Input
                                    placeholder="Cargando..."
                                    disabled
                                    className="h-8"
                                  />
                                ) : (
                                  <SelectSearchable
                                    options={
                                      accountingAccounts?.map(
                                        (account: AccountPlan) => ({
                                          value: String(account.id),
                                          label: `${account.code} - ${account.name}`,
                                        }),
                                      ) ?? []
                                    }
                                    onValueChange={(value) =>
                                      f.onChange(
                                        value === 'null' ? null : value,
                                      )
                                    }
                                    placeholder="Seleccionar cuenta"
                                    defaultValue={
                                      f.value?.toString() || 'null'
                                    }
                                    disabled={readOnly}
                                  />
                                )}
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <FormField
                          control={form.control}
                          name={`details.${index}.isAuxiliary`}
                          render={({ field: f }) => (
                            <FormItem>
                              <FormControl>
                                <Switch
                                  checked={f.value}
                                  onCheckedChange={f.onChange}
                                  disabled={readOnly}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </td>
                      <td className="px-1 py-1.5">
                        {!readOnly && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => remove(index)}
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
              No hay detalles configurados. Agregue al menos un movimiento.
            </p>
          )}
        </div>
      </form>
    </Form>
  );
}

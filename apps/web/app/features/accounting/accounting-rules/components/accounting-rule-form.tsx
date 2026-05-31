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
import { Loader2, Plus, Trash } from 'lucide-react';
import { useEffect, useMemo } from 'react';
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
  const { data: allRules, isLoading: isLoadingRules } = useAllAccountingRules();
  const { data: accountingAccounts, isLoading: isLoadingAccounts } =
    useAccountingAccounts();

  const { data: withdrawalTypes, isLoading: isLoadingWithdrawals } = useWithdrawalTypesQuery(
    { page: 1, limit: 100, sortBy: 'id', sortOrder: 'asc' },
    operationType === 'WITHDRAWAL_TYPE' && !!reference,
  );
  const { data: loanTypes, isLoading: isLoadingLoans } = useLoanTypesQuery(
    { page: 1, limit: 100, sortBy: 'id', sortOrder: 'asc' },
    operationType === 'LOAN_TYPE' && !!reference,
  );
  const { data: creditTypes, isLoading: isLoadingCredits } = useCreditTypesQuery(
    { page: 1, limit: 100, sortBy: 'id', sortOrder: 'asc' },
    operationType === 'CREDIT_TYPE' && !!reference,
  );
  const { data: payrollTypes, isLoading: isLoadingPayroll } = useCategoriesByTypeQuery(
    'payroll_type',
    operationType === 'PAYROLL_CONCEPT' && !!reference,
  );

  const isLoadingData = isLoadingRules || isLoadingAccounts ||
    (operationType === 'WITHDRAWAL_TYPE' && !!reference && isLoadingWithdrawals) ||
    (operationType === 'LOAN_TYPE' && !!reference && isLoadingLoans) ||
    (operationType === 'CREDIT_TYPE' && !!reference && isLoadingCredits) ||
    (operationType === 'PAYROLL_CONCEPT' && !!reference && isLoadingPayroll);

  const referenceLabel = useMemo(() => {
    // For non-dynamic (fixed) operations, use the fixed referenceValue from the operation definition
    if (opDef && !opDef.isDynamic && opDef.referenceValue) {
      return opDef.referenceValue;
    }
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

  // Resolve the effective referenceValue: for fixed ops use opDef.referenceValue, for dynamic use referenceLabel/reference
  const effectiveReferenceValue = useMemo(() => {
    if (opDef && !opDef.isDynamic && opDef.referenceValue) {
      return opDef.referenceValue;
    }
    return referenceLabel || reference || null;
  }, [opDef, referenceLabel, reference]);

  const existingRule = useMemo(() => {
    if (defaultValues?.id) return defaultValues as AccountingRule;
    if (!allRules || !operationType) return undefined;

    if (effectiveReferenceValue) {
      return allRules.find(
        (r) =>
          r.category === category &&
          r.operationType === operationType &&
          r.referenceValue === effectiveReferenceValue,
      );
    }

    return allRules.find(
      (r) =>
        r.category === category &&
        r.operationType === operationType &&
        !r.referenceValue,
    );
  }, [allRules, category, operationType, effectiveReferenceValue, opDef, defaultValues]);

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
        referenceValue: effectiveReferenceValue,
        isActive: true,
        details: [],
      }) as AccountingRule,
    mode: 'onChange',
  });

  useEffect(() => {
    if (existingRule) {
      form.reset({
        id: existingRule.id,
        tenantId: existingRule.tenantId ?? '',
        category: existingRule.category as Category,
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
      });
    } else {
      form.reset({
        tenantId: '',
        category,
        operationType,
        description: '',
        referenceValue: effectiveReferenceValue,
        isActive: true,
        details: [],
      });
    }
  }, [existingRule, category, operationType, reference, referenceLabel, form]);

  const selectedCategory = useWatch({ control: form.control, name: 'category' });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'details',
  });

  // const operationOptions = useMemo(
  //   () => operationsByCategory[selectedCategory] || [],
  //   [selectedCategory],
  // );

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


  if (isLoadingData) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Cargando datos...</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => {
          const sanitizedDetails = data.details?.map((d) => ({
            ...d,
            accountPlanId: d.accountPlanId && d.accountPlanId !== '' && d.accountPlanId !== 'null' ? d.accountPlanId : null,
            accountRole: d.accountRole && d.accountRole !== '' ? d.accountRole : null,
            formula: d.formula && d.formula !== '' ? d.formula : null,
          })) || [];

          const payload: AccountingRule = {
            ...data,
            referenceValue: effectiveReferenceValue,
            tenantId: data.tenantId || '',
            details: sanitizedDetails,
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
          <div className="grid grid-cols-2 gap-4">
            {/* <FormField
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
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue placeholder="Categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SAVINGS_BANK">
                        Caja de Ahorro
                      </SelectItem>
                      <SelectItem value="PURCHASING">
                        Compras
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
                      <SelectTrigger className="h-9 w-full">
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
            /> */}

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
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="relative flex items-stretch rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Inputs Area */}
                  <div className="flex-1 p-4 space-y-4">
                    {/* Row 1: Tipo & Rol */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/75">
                          Tipo
                        </span>
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
                                  <SelectTrigger className="h-9 w-full">
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
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/75">
                          Rol de Cuenta
                        </span>
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
                                  <SelectTrigger className="h-9 w-full">
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
                      </div>
                    </div>

                    {/* Row 2: Cuenta & Aux */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5 sm:col-span-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/75">
                          Cuenta Específica
                        </span>
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
                                    className="h-9"
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
                      </div>
                      <div className="space-y-1.5 flex flex-col justify-end">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/75 text-center block mb-1">
                          Aux. Socio
                        </span>
                        <div className="flex justify-center items-center h-9">
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
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Delete Button Area */}
                  {!readOnly && (
                    <div className="flex items-center justify-center border-l bg-muted/10 px-3 hover:bg-destructive/10 transition-colors group rounded-r-lg">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-muted-foreground group-hover:text-destructive transition-colors"
                        onClick={() => remove(index)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
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

'use client';

import { useAccountingAccounts } from '@/feactures/accounting/accounting-accounts/hooks/use-query-account-plan';
import { useTypePayroll } from '@/feactures/configurations/type-payroll/hooks/use-query-type-payroll';
import { useWithdrawalTypes } from '@/feactures/savings-banks/assets/withdrawal-types/hooks/use-query-withdrawal-types';
import { useTypeCredits } from '@/feactures/savings-banks/credits/type-credits/hooks/use-query-type-credits';
import { useTypeLoans } from '@/feactures/savings-banks/loans/type-loans/hooks/use-query-type-loans';
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
import { Separator } from '@repo/shadcn/separator';
import { Plus, Trash } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useAccountingRuleMutation } from '../hooks/use-accounting-rules-mutation';
import {
  AccountingRule,
  accountingRuleSchema,
} from '../schemas/accounting-rule.schema';

interface AccountingRuleFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<AccountingRule>;
  readOnly?: boolean;
}

export function AccountingRuleForm({
  onSuccess,
  onCancel,
  defaultValues,
  readOnly = false,
}: AccountingRuleFormProps) {
  const { mutate: saveAccountingRule, isPending: isSaving } =
    useAccountingRuleMutation();
  const { data: accountingAccounts, isLoading: isLoadingAccounts } =
    useAccountingAccounts();

  // Load Reference Data
  const { data: withdrawalTypes } = useWithdrawalTypes();
  const { data: loanTypes } = useTypeLoans();
  const { data: creditTypes } = useTypeCredits();
  const { data: payrollTypes } = useTypePayroll();

  const form = useForm<AccountingRule>({
    resolver: zodResolver(accountingRuleSchema),
    defaultValues: {
      id: defaultValues?.id,
      companyId: defaultValues?.companyId || 1,
      category: defaultValues?.category || 'SAVINGS_BANK',
      operationType: defaultValues?.operationType || '',
      description: defaultValues?.description || '',
      referenceId: defaultValues?.referenceId || null,
      isActive: defaultValues?.isActive ?? true,
      details: defaultValues?.details || [],
    },
    mode: 'onChange',
  });

  const category = useWatch({ control: form.control, name: 'category' });
  const operationType = useWatch({
    control: form.control,
    name: 'operationType',
  });

  // Reset dependent fields when category changes
  useEffect(() => {
    // Avoid resetting on initial load if verifying same values
    if (defaultValues?.category && defaultValues.category === category) return;

    // If user changes category manually, reset operationType and referenceId
    // Logic: If current operationType is not in the new category options, reset it.
    // For simplicity, we could reset always, but that might be annoying if accidentally clicked.
    // Let's rely on the user to pick a new one, but we should clear referenceId if operationType changes.
  }, [category]);

  // Reset referenceId when operationType changes
  useEffect(() => {
    if (
      defaultValues?.operationType &&
      defaultValues.operationType === operationType
    )
      return;
    form.setValue('referenceId', null);
  }, [operationType, form, defaultValues]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'details',
  });

  const operationOptions = useMemo(() => {
    switch (category) {
      case 'SAVINGS_BANK':
        return [
          { value: 'PAYROLL_CONCEPT', label: 'Concepto Nómina' },
          { value: 'WITHDRAWAL_TYPE', label: 'Tipo de Retiro' },
          { value: 'LOAN_TYPE', label: 'Tipo de Préstamo' },
          { value: 'CREDIT_TYPE', label: 'Tipo de Crédito' },
          { value: 'CREDIT_PAYMENT', label: 'Pago de Crédito' },
          { value: 'LOAN_PAYMENT', label: 'Pago de Préstamo' },
          { value: 'LOAN_DISBURSEMENT', label: 'Desembolso Préstamo' },
          { value: 'INTEREST_ACCRUAL', label: 'Causación de Intereses' },
          { value: 'SAVINGS_UPLOAD', label: 'Carga de Haberes' },
        ];
      case 'ADMINISTRATIVE':
        return [
          { value: 'INVOICE_RECEPTION', label: 'Recepción de Factura' },
          { value: 'SUPPLIER_ADVANCE', label: 'Anticipo a Proveedor' },
          { value: 'CREDIT_NOTE', label: 'Nota de Crédito' },
          { value: 'SUPPLIER_PAYMENT', label: 'Pago a Proveedor' },
        ];
      case 'BANKING':
        return [
          {
            value: 'TRANSFER_BETWEEN_ACCOUNTS',
            label: 'Transferencia entre Cuentas',
          },
          { value: 'BANK_DEBIT_NOTE', label: 'Nota de Débito Bancaria' },
          { value: 'BANK_CREDIT_NOTE', label: 'Nota de Crédito Bancaria' },
          {
            value: 'CHECK_ISSUANCE_PAYMENT',
            label: 'Emisión de Cheque / Pago',
          },
          {
            value: 'EMPLOYER_DEPOSIT_RECEPTION',
            label: 'Recepción Depósito Patronal',
          },
          {
            value: 'LOAN_COLLECTION_PAYROLL',
            label: 'Recaudación Préstamos (Nómina)',
          },
          {
            value: 'LOAN_COLLECTION_WINDOW',
            label: 'Cobro de Préstamo (Ventanilla)',
          },
          {
            value: 'CONTRIBUTION_INCOME_PAYROLL',
            label: 'Ingreso por Aportes (Nómina)',
          },
          { value: 'OTHER_BANKING', label: 'Otros' },
        ];
      case 'ACCOUNTING':
        return [
          {
            value: 'FISCAL_YEAR_CLOSING',
            label: 'Cierre de Ejercicio (Anual)',
          },
          { value: 'EXCHANGE_DIFFERENCE', label: 'Diferencia de Cambio' },
          { value: 'ASSET_DEPRECIATION', label: 'Depreciación de Activos' },
          { value: 'EXPENSE_AMORTIZATION', label: 'Amortización de Gastos' },
          { value: 'OTHER_ACCOUNTING', label: 'Otros' },
        ];
      case 'INVENTORY':
        return [
          { value: 'GOODS_RECEIPT', label: 'Recepción de Mercancía' },
          {
            value: 'INVENTORY_ADJUSTMENT_NEG',
            label: 'Ajuste de Inventario (-)',
          },
          { value: 'SALE_OUTPUT', label: 'Salida por Venta' },
          {
            value: 'WAREHOUSE_TRANSFER',
            label: 'Transferencia entre Almacenes',
          },
        ];
      default:
        return [];
    }
  }, [category]);

  const referenceOptions = useMemo(() => {
    switch (operationType) {
      case 'PAYROLL_CONCEPT':
        return (
          payrollTypes?.data?.map((p) => ({
            label: p.description,
            value: p.id!.toString(),
          })) || []
        );
      case 'WITHDRAWAL_TYPE':
        // withdrawalTypes hook returns paginated response { data: [...] } if using paginated hook?
        // Let's check the hook implementation. useWithdrawalTypes(params) returns paginated list.
        return (
          withdrawalTypes?.data?.map((w: any) => ({
            label: w.description,
            value: w.id.toString(),
          })) || []
        );
      case 'LOAN_TYPE':
        return (
          loanTypes?.data?.map((l) => ({
            label: l.name,
            value: l.id!.toString(),
          })) || []
        );
      case 'CREDIT_TYPE':
        return (
          creditTypes?.data?.map((c) => ({
            label: c.name,
            value: c.id!.toString(),
          })) || []
        );
      default:
        return [];
    }
  }, [operationType, withdrawalTypes, loanTypes, creditTypes, payrollTypes]);

  const requiresReference = [
    'PAYROLL_CONCEPT',
    'WITHDRAWAL_TYPE',
    'LOAN_TYPE',
    'CREDIT_TYPE',
  ].includes(operationType);
  const showReviewMessage =
    operationType === 'PAYROLL_CONCEPT' &&
    (!payrollTypes?.data || payrollTypes.data.length === 0);

  const onSubmit = async (data: AccountingRule) => {
    saveAccountingRule(data, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
      onError: () => {
        form.setError('root', {
          type: 'manual',
          message: 'Error al guardar la regla contable',
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
          {/* CATEGORY SELECT */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={readOnly}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione Categoría" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="SAVINGS_BANK">Caja de Ahorro</SelectItem>
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

          {/* OPERATION TYPE SELECT (OR INPUT FOR OTHERS) */}
          <FormField
            control={form.control}
            name="operationType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Operación</FormLabel>
                {operationOptions.length > 0 ? (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={readOnly}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione Operación" />
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
                ) : (
                  <FormControl>
                    <Input
                      placeholder="Ej. TRANSFERENCIA_MANUAL"
                      {...field}
                      disabled={readOnly}
                    />
                  </FormControl>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* REFERENCE ID SELECT (CONDITIONAL) */}
          {requiresReference && (
            <FormField
              control={form.control}
              name="referenceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referencia Específica</FormLabel>
                  <FormControl>
                    <SelectSearchable
                      options={referenceOptions}
                      onValueChange={(val) =>
                        field.onChange(val ? Number(val) : null)
                      }
                      defaultValue={field.value?.toString() || ''}
                      placeholder="Seleccione Referencia"
                      disabled={readOnly}
                    />
                  </FormControl>
                  {showReviewMessage && (
                    <p className="text-[0.8rem] text-muted-foreground">
                      No se encontraron tipos configurados.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Descripción de la regla"
                    {...field}
                    value={field.value || ''}
                    disabled={readOnly}
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
              <FormItem className="w-full">
                <FormLabel>Estatus</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === 'true')}
                  defaultValue={field.value?.toString()}
                  disabled={readOnly}
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

        <Separator className="my-4" />

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
                  accountRole: null,
                  formula: null,
                  accountPlanId: null,
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Detalle
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex gap-4 items-end border p-4 rounded-md"
            >
              <FormField
                control={form.control}
                name={`details.${index}.movementType`}
                render={({ field }) => (
                  <FormItem className="min-w-[120px]">
                    <FormLabel>Tipo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={readOnly}
                    >
                      <FormControl>
                        <SelectTrigger>
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

              <FormField
                control={form.control}
                name={`details.${index}.accountRole`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Rol de Cuenta</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej. CAJA_PRINCIPAL"
                        {...field}
                        value={field.value || ''}
                        disabled={readOnly}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`details.${index}.accountPlanId`}
                render={({ field }) => (
                  <FormItem className="flex-1 min-w-[200px]">
                    <FormLabel>Cuenta Específica</FormLabel>
                    <FormControl>
                      {isLoadingAccounts ? (
                        <Input placeholder="Cargando..." disabled />
                      ) : (
                        <SelectSearchable
                          options={
                            accountingAccounts?.data?.map((account) => ({
                              value: account.id!.toString(),
                              label: `${account.code} - ${account.name}`,
                            })) ?? []
                          }
                          onValueChange={(value) =>
                            field.onChange(
                              value === 'null' ? null : Number(value),
                            )
                          }
                          placeholder="Seleccionar cuenta"
                          defaultValue={field.value?.toString() || 'null'}
                          disabled={readOnly}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!readOnly && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => remove(index)}
                  className="mb-2"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" type="button" onClick={onCancel}>
            {readOnly ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!readOnly && (
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}

'use client';

import { useAccountingAccounts } from '@/feactures/accounting/accounting-accounts/hooks/use-query-account-plan';
import { useTypePayroll } from '@/feactures/configurations/type-payroll/hooks/use-query-type-payroll';
import { useWithdrawalTypes } from '@/feactures/savings-banks/assets/withdrawal-types/hooks/use-query-withdrawal-types';
import { useTypeCredits } from '@/feactures/savings-banks/credits/type-credits/hooks/use-query-type-credits';
import { useTypeLoans } from '@/feactures/savings-banks/loans/type-loans/hooks/use-query-type-loans';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import { Switch } from '@repo/shadcn/components/ui/switch';
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
import { useAccountingRules } from '../hooks/use-query-accounting-rules';
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
  const { data: accountingRules } = useAccountingRules(1);
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
      referenceValue: defaultValues?.referenceValue || null,
      isActive: defaultValues?.isActive ?? true,
      details:
        defaultValues?.details?.map((d) => ({
          ...d,
          isAuxiliary: d.isAuxiliary ?? false,
          isAuxiliarySupplier: d.isAuxiliarySupplier ?? false,
        })) || [],
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
    form.setValue('referenceValue', null);
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
          {
            value: 'BANK_INITIAL_BALANCE',
            label: 'Carga de Saldo Inicial',
          },
          {
            value: 'BANK_FEE',
            label: 'Comisión por Cuenta',
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
          { value: 'MANUAL_ADJUSTMENT', label: 'Ajuste Manual' },
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

  // Filter operation options based on existing rules
  const filteredOperationOptions = useMemo(() => {
    if (!accountingRules) return operationOptions;

    // Types that allow multiple rules (based on reference)
    const allowMultiple = [
      'PAYROLL_CONCEPT',
      'WITHDRAWAL_TYPE',
      'LOAN_TYPE',
      'CREDIT_TYPE',
      'SAVINGS_UPLOAD',
    ];

    return operationOptions.filter((op) => {
      // If currently selected, always show
      if (defaultValues?.operationType === op.value) return true;

      // Check if rule exists
      const existingRule = accountingRules.find(
        (rule) => rule.operationType === op.value,
      );

      // If exists and DOES NOT allow multiple, filter out
      if (existingRule && !allowMultiple.includes(op.value)) {
        return false;
      }

      return true;
    });
  }, [accountingRules, operationOptions, defaultValues]);

  const referenceOptions = useMemo(() => {
    // 1. Get other rules (exclude current if editing by ID)
    // If defaultValues.id is present, we exclude that rule from the "used" check.
    const otherRules = accountingRules?.filter(
      (r) => r.id !== defaultValues?.id,
    );

    // 2. Get used references for current operationType from OTHER rules
    const usedReferences =
      otherRules
        ?.filter((r) => r.operationType === operationType)
        .map((r) => r.referenceValue) || [];

    let options: { label: string; value: string }[] = [];

    switch (operationType) {
      case 'SAVINGS_UPLOAD':
        options = [
          { value: 'Aporte Voluntario', label: 'Aporte Voluntario' },
        ];
        break;
      case 'PAYROLL_CONCEPT':
        options =
          payrollTypes?.data?.map((p) => ({
            label: p.description,
            value: p.id!.toString(),
          })) || [];
        break;
      case 'WITHDRAWAL_TYPE':
        options =
          withdrawalTypes?.data?.map((w: any) => ({
            label: w.description,
            value: w.id.toString(),
          })) || [];
        break;
      case 'LOAN_TYPE':
        options =
          loanTypes?.data?.map((l) => ({
            label: l.name,
            value: l.id!.toString(),
          })) || [];
        break;
      case 'CREDIT_TYPE':
        options =
          creditTypes?.data?.map((c) => ({
            label: c.name,
            value: c.id!.toString(),
          })) || [];
        break;
      default:
        return [];
    }

    // 3. Filter output options
    return options.filter((opt) => !usedReferences.includes(String(opt.value)));
  }, [
    operationType,
    withdrawalTypes,
    loanTypes,
    creditTypes,
    payrollTypes,
    accountingRules,
    defaultValues,
  ]);

  const roleOptions = useMemo(() => {
    switch (category) {
      case 'SAVINGS_BANK':
        return [
          { value: 'ASSOCIATED_ACCOUNT', label: 'Cuenta Asociado' },
          { value: 'EMPLOYER_ACCOUNT', label: 'Cuenta Patrono' },
          { value: 'LOAN_ACCOUNT', label: 'Cuenta Préstamo' },
          {
            value: 'CREDIT_ACCOUNT',
            label: 'Cuenta Crédito',
          },
          {
            value: 'WITHDRAWAL_ACCOUNT',
            label: 'Cuenta Retiro',
          },
          { value: 'INTEREST_EARNED', label: 'Intereses Ganados' },
          { value: 'SPECIAL_QUOTAS', label: 'Cuotas Especiales' },
          { value: 'EXPENSE', label: 'Gasto' },
          { value: 'ASSOCIATED_EARNINGS', label: 'Haberes Asociados' },
          { value: 'LOAN_RECEIVABLE', label: 'Prestamos por Cobrar' },
          { value: 'INTEREST_OVERDUE', label: 'Intereses Vencido' },
          { value: 'CASH_SAVINGS_ACCOUNT', label: 'Caja Ahorro Efetivo' },
        ];
      case 'ADMINISTRATIVE':
        return [
          { value: 'PURCHASE_VAT', label: 'Iva Compra' },
          { value: 'SUPPLIER_CONTROL', label: 'Proveedor Control' },
          { value: 'GASTO_OPERATIVO', label: 'Gasto Operativo' },
        ];
      case 'BANKING':
        return [
          { value: 'SOURCE_BANK', label: 'Banco Origen' },
          { value: 'DESTINATION_BANK', label: 'Banco Destino' },
          { value: 'GENERAL_COUNTERPART', label: 'Contra Partida General' },
          { value: 'INITIAL_BALANCE_CAPITAL', label: 'Saldo Inicial Capital' },
        ];
      case 'INVENTORY':
        return [
          { value: 'INV_ACTIVO', label: 'Activo' },
          { value: 'INV_TRANSIT_PAYABLE', label: 'Transito Pagar' },
          { value: 'INV_AJUSTE_GASTO', label: 'Ajuste Gasto' },
          { value: 'INV_COSTO_VENTA', label: 'Costo Venta' },
          { value: 'INV_ORIGEN', label: 'Origen' },
          { value: 'INV_DESTINO', label: 'Destino' },
        ];
      case 'ACCOUNTING':
        return [
          {
            value: 'CONT_FISCAL_YEAR_RESULT',
            label: 'Resultado Ejercicio',
          },
          { value: 'CONT_CUENTA_CIERRE', label: 'Cuenta Cierre' },
          { value: 'CONT_DIF_CAMBIO_GASTO', label: 'Diferencia Cambio Gasto' },
          {
            value: 'CONT_DIF_CAMBIO_INGRESO',
            label: 'Diferencia Cambio Ingreso',
          },
          {
            value: 'CONT_FOREIGN_CURRENCY_ASSET',
            label: 'Activo Moneda Extranjera',
          },
          { value: 'CONT_ACCUMULATED_DEP', label: 'Dep Acumulada' },
          { value: 'CONT_DEP_GASTO', label: 'Dep Gasto' },
          { value: 'CONT_AMORT_GASTO', label: 'Amort Gasto' },
          { value: 'CONT_ACTIVO_DIFERIDO', label: 'Activo Diferido' },
        ];
      default:
        return [];
    }
  }, [category]);

  const requiresReference = [
    'PAYROLL_CONCEPT',
    'WITHDRAWAL_TYPE',
    'LOAN_TYPE',
    'CREDIT_TYPE',
    'SAVINGS_UPLOAD',
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
                {filteredOperationOptions.length > 0 ? (
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
                      {filteredOperationOptions.map((op) => (
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
              name="referenceValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referencia Específica</FormLabel>
                  <FormControl>
                    <SelectSearchable
                      options={referenceOptions}
                      onValueChange={(val) => {
                        field.onChange(val ? String(val) : null);
                        const selectedOption = referenceOptions.find(
                          (opt) => opt.value === val,
                        );
                        form.setValue(
                          'referenceValue',
                          selectedOption ? selectedOption.label : null,
                        );
                      }}
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
                  isAuxiliary: false,
                  isAuxiliarySupplier: false,
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
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ''}
                      disabled={readOnly}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione Rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roleOptions.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
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

              <FormField
                control={form.control}
                name={`details.${index}.isAuxiliary`}
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center justify-end space-y-2 pb-2">
                    <FormLabel className="text-xs">Aux. Socio</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={readOnly}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* <FormField
                control={form.control}
                name={`details.${index}.isAuxiliarySupplier`}
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center justify-end space-y-2 pb-2">
                    <FormLabel className="text-xs">Aux. Prov.</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={readOnly}
                      />
                    </FormControl>
                  </FormItem>
                )}
              /> */}

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

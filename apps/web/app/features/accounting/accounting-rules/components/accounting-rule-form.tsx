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
import { Switch } from '@repo/shadcn/switch';
import { Plus, Trash } from 'lucide-react';
import { useMemo } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useAccountingAccounts } from '../../accounting-accounts/hooks/use-accounting-accounts-query';
import { useAccountingRuleMutation } from '../hooks/use-accounting-rules-mutation';
import { useAccountingRules } from '../hooks/use-accounting-rules-query';
import {
  type AccountingRule,
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
  const { data: accountingRules } = useAccountingRules({});
  const { data: accountingAccounts, isLoading: isLoadingAccounts } =
    useAccountingAccounts();

  // Mocks for missing features not yet ported
  const withdrawalTypes = { data: [] };
  const loanTypes = { data: [] };
  const creditTypes = { data: [] };
  const payrollTypes = { data: [] };

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
          { value: 'BANK_INITIAL_BALANCE', label: 'Carga de Saldo Inicial' },
          { value: 'BANK_FEE', label: 'Comisión por Cuenta' },
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

  const roleOptions = useMemo(() => {
    switch (category) {
      case 'SAVINGS_BANK':
        return [
          { value: 'ASSOCIATED_SAVINGS', label: 'Ahorro Asociados (Haberes)' },
          { value: 'EMPLOYER_CONTRIBUTION', label: 'Aporte Patrono (Haberes)' },
          { value: 'VOLUNTARY_SAVINGS', label: 'Ahorro Voluntario (Haberes)' },
          {
            value: 'PARTIAL_WITHDRAWAL_SAVINGS',
            label: 'Retiro Parcial (Haberes)',
          },
          {
            value: 'SPECIAL_WITHDRAWAL_SAVINGS',
            label: 'Retiro Especial / Consumo (Haberes)',
          },
          {
            value: 'DIVIDENDS_PAYABLE',
            label: 'Dividendos / Excedentes por Pagar',
          },
          { value: 'SAVINGS_RECEIVABLE', label: 'Ahorro x Cobrar (Activo)' },
          { value: 'EMPLOYER_RECEIVABLE', label: 'Aporte x Cobrar (Activo)' },
          { value: 'LOAN_PRINCIPAL', label: 'Préstamo Capital (Activo)' },
          { value: 'CREDIT_PRINCIPAL', label: 'Crédito Capital (CP/LP)' },
          {
            value: 'OPERATION_COUNTERPART',
            label: 'Inventario / Cuenta x Pagar',
          },
          { value: 'BANK_ACCOUNT', label: 'Banco Institución' },
          { value: 'CASH_ACCOUNT', label: 'Caja Principal' },
          { value: 'SERVICE_FEE_INCOME', label: 'Ingresos por Comisiones' },
          { value: 'LOAN_INTEREST_INCOME', label: 'Ingresos por Intereses' },
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
        ];
      case 'INVENTORY':
        return [
          { value: 'INV_ACTIVO', label: 'Activo' },
          { value: 'INV_COSTO_VENTA', label: 'Costo Venta' },
        ];
      case 'ACCOUNTING':
        return [
          { value: 'CONT_FISCAL_YEAR_RESULT', label: 'Resultado Ejercicio' },
          { value: 'CONT_CUENTA_CIERRE', label: 'Cuenta Cierre' },
        ];
      default:
        return [];
    }
  }, [category]);

  const onSubmit = async (data: AccountingRule) => {
    saveAccountingRule(data, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
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

          <FormField
            control={form.control}
            name="operationType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Operación</FormLabel>
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
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="col-span-2">
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
              <FormItem>
                <FormLabel>Estatus</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === 'true')}
                  defaultValue={field.value?.toString()}
                  disabled={readOnly}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona opción" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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
                            accountingAccounts?.map((account: any) => ({
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

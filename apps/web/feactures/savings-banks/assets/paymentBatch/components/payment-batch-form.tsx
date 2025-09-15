'use client';

import { IconWrapper } from '@/components/icon-wrapper';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/card';
import { SelectSearchable } from '@repo/shadcn/components/ui/select-searchable';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/shadcn/form';
import { Textarea } from '@repo/shadcn/textarea';
import { Banknote, Check } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useBankAccountAll } from '../../../../banks/bank-account/hooks/use-query-bank-account';
import {
  useApprovedLiquidations,
  useApprovedLoans,
  useApprovedWithdrawals,
} from '../hooks/use-query-source-items';
import {
  CreatePaymentBatch,
  createPaymentBatchSchema,
} from '../schemas/payment-batch.schema';
import { ApprovedItemsTable } from './approved-items-table';

interface PaymentBatchFormProps {
  isSubmitting: boolean;
  onSubmit: (data: CreatePaymentBatch) => void;
  onCancel: () => void;
  initialData?: any; // TODO: Define a proper type for initialData
  isEdit?: boolean;
}

interface SelectedItem {
  type: 'LOAN' | 'WITHDRAWAL' | 'LIQUIDATION';
  sourceId: number;
}

export function PaymentBatchForm({
  isSubmitting,
  onSubmit,
  onCancel,
  initialData,
  isEdit,
}: PaymentBatchFormProps) {
  const form = useForm<CreatePaymentBatch>({
    resolver: zodResolver(createPaymentBatchSchema),
    defaultValues: initialData || {
      bankAccountId: undefined,
      currencyCode: 'VES', // Default currency, will be updated based on bank account
      description: '',
      status: 'DRAFT', // Default status
      items: [],
    },
  });

  const { data: bankAccountsData, isLoading: isLoadingBankAccounts } =
    useBankAccountAll();
  const bankAccounts = bankAccountsData?.data || [];

  const selectedBankAccountId = form.watch('bankAccountId');
  const selectedBankAccount = useMemo(() => {
    return bankAccounts.find((acc) => acc.id === selectedBankAccountId);
  }, [selectedBankAccountId, bankAccounts]);

  // Update currencyCode when bank account changes

  // Fetch approved items
  const { data: approvedLoans, isLoading: isLoadingLoans } = useApprovedLoans();
  const { data: approvedWithdrawals, isLoading: isLoadingWithdrawals } =
    useApprovedWithdrawals();
  const { data: approvedLiquidations, isLoading: isLoadingLiquidations } =
    useApprovedLiquidations();

  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>(
    initialData?.items || [],
  );

  // Keep form items in sync with selectedItems state
  useEffect(() => {
    form.setValue('items', selectedItems);
  }, [selectedItems, form]);

  const handleSelectionChange = (newSelectedItems: SelectedItem[]) => {
    setSelectedItems(newSelectedItems);
  };

  const selectedLoansCount = selectedItems.filter(
    (item) => item.type === 'LOAN',
  ).length;
  const selectedWithdrawalsCount = selectedItems.filter(
    (item) => item.type === 'WITHDRAWAL',
  ).length;
  const selectedLiquidationsCount = selectedItems.filter(
    (item) => item.type === 'LIQUIDATION',
  ).length;

  const totalSelectedAmount = useMemo(() => {
    let total = 0;
    selectedItems.forEach((selected) => {
      let item;
      if (selected.type === 'LOAN') {
        item = approvedLoans?.find((loan) => loan.id === selected.sourceId);
      } else if (selected.type === 'WITHDRAWAL') {
        item = approvedWithdrawals?.find(
          (withdrawal) => withdrawal.id === selected.sourceId,
        );
      } else if (selected.type === 'LIQUIDATION') {
        item = approvedLiquidations?.find(
          (liquidation) => liquidation.id === selected.sourceId,
        );
      }
      if (item) {
        total += Number(item.amount);
      }
    });
    return total;
  }, [selectedItems, approvedLoans, approvedWithdrawals, approvedLiquidations]);
  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconWrapper className="w-8 h-8">
            <Banknote />
          </IconWrapper>
          Datos del Lote de Pago
        </CardTitle>
        <CardDescription>
          Ingrese la información para crear un nuevo lote de pago.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bankAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cuenta Bancaria Origen</FormLabel>
                    <SelectSearchable
                      options={bankAccounts.map((acc) => ({
                        value: String(acc.id),
                        label: `${acc.accountName} (${acc.accountNumber})`,
                      }))}
                      onValueChange={(value) => field.onChange(Number(value))}
                      placeholder="Seleccione una cuenta bancaria"
                      defaultValue={String(field.value) || ''}
                      disabled={isSubmitting || isLoadingBankAccounts}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* <FormField
                control={form.control}
                name="currencyCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moneda del Lote</FormLabel>
                    <SelectSearchable
                      options={currencies.map((curr) => ({
                        value: curr.code,
                        label: `${curr.name} (${curr.code})`,
                      }))}
                      onValueChange={field.onChange}
                      placeholder="Seleccione la moneda"
                      defaultValue={field.value}
                      disabled={true} // Currency is derived from bank account
                    />
                    <FormMessage />
                  </FormItem>
                )}
              /> */}
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descripción del lote de pago (opcional)"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Loans Section */}
            <Card>
              <CardHeader>
                <CardTitle>Préstamos Aprobados</CardTitle>
              </CardHeader>
              <CardContent>
                <ApprovedItemsTable
                  title="Préstamos"
                  items={approvedLoans || []}
                  itemType={'LOAN'}
                  onSelectionChange={handleSelectionChange}
                  selectedItems={selectedItems}
                />
              </CardContent>
            </Card>

            {/* Withdrawals Section */}
            <Card>
              <CardHeader>
                <CardTitle>Retiros Aprobados</CardTitle>
              </CardHeader>
              <CardContent>
                <ApprovedItemsTable
                  title="Retiros"
                  items={approvedWithdrawals || []}
                  itemType={'WITHDRAWAL'}
                  onSelectionChange={handleSelectionChange}
                  selectedItems={selectedItems}
                />
              </CardContent>
            </Card>

            {/* Liquidations Section */}
            <Card>
              <CardHeader>
                <CardTitle>Liquidaciones Aprobadas</CardTitle>
              </CardHeader>
              <CardContent>
                <ApprovedItemsTable
                  title="Liquidaciones"
                  items={approvedLiquidations || []}
                  itemType={'LIQUIDATION'}
                  onSelectionChange={handleSelectionChange}
                  selectedItems={selectedItems}
                />
              </CardContent>
            </Card>

            {/* Summary Section */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen del Lote</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Préstamos seleccionados:</span>
                  <span className="font-medium">{selectedLoansCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Retiros seleccionados:</span>
                  <span className="font-medium">
                    {selectedWithdrawalsCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Liquidaciones seleccionadas:</span>
                  <span className="font-medium">
                    {selectedLiquidationsCount}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold mt-4 pt-2 border-t">
                  <span>Monto Total:</span>
                  <span>
                    {totalSelectedAmount.toFixed(2)}{' '}
                    {form.getValues('currencyCode')}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || selectedItems.length === 0}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-1">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                    Procesando...
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Check className="h-4 w-4" />
                    {isEdit ? 'Actualizar Lote' : 'Crear Lote'}
                  </span>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

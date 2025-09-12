'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import { Checkbox } from '@repo/shadcn/components/ui/checkbox';
import { CustomCalendar } from '@repo/shadcn/components/ui/custom-calendar';
import { MultiSelect } from '@repo/shadcn/components/ui/multi-select';
import { SelectSearchable } from '@repo/shadcn/components/ui/select-searchable';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/shadcn/form';
import { Input } from '@repo/shadcn/input';
import { ScrollArea } from '@repo/shadcn/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/shadcn/table';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useBankAccountAll } from '../../../banks/bank-account/hooks/use-query-bank-account';
import {
  PAYMENT_METHOD_TYPES,
  PaymentMethodEnum,
} from '../../supplier-payments/schemas';
import { useSupplierAll } from '../../suppliers/hooks/use-query-suppliers';
import { useMassivePaymentMutation } from '../hooks/use-mutation-massive-payment';
import { useAccountsPayableBySuppliers } from '../hooks/use-query-massive-payment';
import {
  MassivePayment,
  massivePaymentSchema,
} from '../schemas/massive-payment.schema';

interface FormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function MassivePaymentForm({ onSuccess, onCancel }: FormProps) {
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);

  //hook de mutacion pago masivo
  const { mutate: massivePayment, isPending } = useMassivePaymentMutation();

  //consultas
  const { data: bankAccounts, isLoading: isLoadingBankAccounts } =
    useBankAccountAll(); //todas las cuenta de bancos
  const { data: suppliers, isLoading: isLoadingSuppliers } = useSupplierAll(); //todos los proveedores

  const actualSupplierIds = useMemo(() => {
    if (selectedSuppliers.includes('all')) {
      return suppliers?.map((s) => Number(s.id)) || [];
    }
    return selectedSuppliers.map((id) => Number(id));
  }, [selectedSuppliers, suppliers]);

  const { data: accountsPayable, isLoading: isLoadingAccountsPayable } =
    useAccountsPayableBySuppliers({
      supplierIds: actualSupplierIds,
    }); // hook para consultar las cuentas por pagar

  const form = useForm<MassivePayment>({
    resolver: zodResolver(massivePaymentSchema),
    defaultValues: {
      paymentMethod: PaymentMethodEnum.BANK_TRANSFER,
      transactionDate: new Date(),
      paymentDescription: '',
      bankAccountId: undefined,
      bankReference: '',
      accounts: [],
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: 'accounts',
  });

  const isPaymentDetailsDisabled = selectedSuppliers.length === 0;

  useEffect(() => {
    if (actualSupplierIds.length === 0) {
      replace([]);
      return;
    }
    if (accountsPayable?.data) {
      const newAccounts = accountsPayable.data.map((ap: any) => {
        // Find the supplierId based on supplierName from the suppliers list
        const foundSupplier = suppliers?.find(
          (s) => s.name === ap.supplierName,
        );
        const supplierId = foundSupplier ? foundSupplier.id : undefined;

        return {
          ...ap,
          selected: false,
          amountToPay: ap.remainingAmount,
          supplierId: supplierId, // Assign the found supplierId
        };
      });
      replace(newAccounts);
    }
  }, [accountsPayable, replace, actualSupplierIds, suppliers]); // Add suppliers to dependency array // Add actualSupplierIds to dependency array

  const selectedAccounts = form.watch('accounts').filter((acc) => acc.selected);
  const totalAmount = useMemo(
    () =>
      selectedAccounts.reduce(
        (sum, acc) => sum + Number(acc.amountToPay || 0),
        0,
      ),
    [selectedAccounts],
  );
  const onSubmit = (data: MassivePayment) => {
    const selectedAccounts = data.accounts.filter((acc) => acc.selected);

    // Group selected accounts by supplierId
    const paymentsBySupplier = new Map<
      number,
      {
        supplierId: number;
        accounts: Array<{
          accountsPayableId: number;
          amount: number;
          description?: string;
        }>;
        totalAmount: number;
      }
    >();

    selectedAccounts.forEach((account) => {
      const supplierId = account.supplierId;
      if (supplierId === undefined) {
        console.error('Supplier ID is undefined for account:', account);
        return; // Skip if supplierId is missing
      }

      if (!paymentsBySupplier.has(supplierId)) {
        paymentsBySupplier.set(supplierId, {
          supplierId: supplierId,
          accounts: [],
          totalAmount: 0,
        });
      }
      const supplierPayment = paymentsBySupplier.get(supplierId)!;
      supplierPayment.accounts.push({
        accountsPayableId: account.id as number,
        amount: account.amountToPay,
        description: `Pago de CxP ${account.accountsPayableNumber}`, // Specific description for each line
      });
      supplierPayment.totalAmount += account.amountToPay;
    });

    const bulkPaymentsPayload = Array.from(paymentsBySupplier.values()).map(
      (supplierPayment) => ({
        supplierId: supplierPayment.supplierId,
        totalAmount: supplierPayment.totalAmount,
        paymentMethod: data.paymentMethod,
        bankAccountId: data.bankAccountId,
        bankDescription: data.paymentDescription,
        bankReference: data.bankReference,
        bankTransactionDate: data.transactionDate,
        observations: data.paymentDescription,
        lines: supplierPayment.accounts,
      }),
    );

    massivePayment(bulkPaymentsPayload, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  const supplierOptions = useMemo(() => {
    const allOptions =
      suppliers?.map((s) => ({
        value: s.id!.toString(),
        label: s.name,
      })) || [];
    return [{ value: 'all', label: 'Seleccionar Todos' }, ...allOptions];
  }, [suppliers]);

  // Handle changes from MultiSelect
  const handleSupplierChange = (values: string[]) => {
    if (values.includes('all')) {
      // If "Select All" is chosen, select all suppliers
      const allSupplierIds = suppliers?.map((s) => s.id!.toString()) || [];
      setSelectedSuppliers(['all', ...allSupplierIds]);
    } else {
      // If "Select All" is deselected, or individual suppliers are chosen
      setSelectedSuppliers(values.filter((value) => value !== 'all')); // Remove "all" if present
    }
  };

  return (
    <Form {...form}>
      <ScrollArea className="h-[calc(100vh-200px)]">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormItem>
              <FormLabel>Proveedores</FormLabel>
              <MultiSelect
                options={supplierOptions}
                value={selectedSuppliers}
                onChange={handleSupplierChange}
                placeholder="Seleccione proveedores"
                variant="inverted"
              />
              <FormMessage />
            </FormItem>
          </div>

          <ScrollArea className="h-64 border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Checkbox
                      checked={
                        fields.length > 0 &&
                        selectedAccounts.length === fields.length
                      }
                      onCheckedChange={(checked) => {
                        const updatedAccounts = form
                          .getValues('accounts')
                          .map((acc) => ({
                            ...acc,
                            selected: !!checked,
                          }));
                        form.setValue('accounts', updatedAccounts);
                      }}
                    />
                  </TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Pendiente</TableHead>
                  <TableHead>Monto a Pagar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingAccountsPayable ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : (
                  fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Controller
                          control={form.control}
                          name={`accounts.${index}.selected`}
                          render={({ field: controllerField }) => (
                            <Checkbox
                              checked={controllerField.value}
                              onCheckedChange={controllerField.onChange}
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        {
                          form.getValues(`accounts.${index}`)
                            .accountsPayableNumber
                        }
                      </TableCell>
                      <TableCell>
                        {form.getValues(`accounts.${index}`).supplierName}
                      </TableCell>
                      <TableCell>
                        {form.getValues(`accounts.${index}`).dueDate}
                      </TableCell>
                      <TableCell>
                        {form.getValues(`accounts.${index}`).remainingAmount}
                      </TableCell>
                      <TableCell>
                        <Controller
                          control={form.control}
                          name={`accounts.${index}.amountToPay`}
                          render={({ field: controllerField }) => (
                            <Input
                              type="number"
                              {...controllerField}
                              onChange={(e) =>
                                controllerField.onChange(Number(e.target.value))
                              }
                              disabled={
                                !form.watch(`accounts.${index}.selected`)
                              } // Add this line
                            />
                          )}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>

          <fieldset disabled={isPaymentDetailsDisabled}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="bankAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pagar desde la cuenta</FormLabel>
                    <SelectSearchable
                      options={
                        bankAccounts?.data.map((item: any) => ({
                          value: item.id!.toString(),
                          label: `${item.accountName} - ${item.accountNumber}`,
                        })) || []
                      }
                      onValueChange={(value) => field.onChange(Number(value))}
                      placeholder="Selecciona una cuenta bancaria"
                      defaultValue={field.value?.toString()}
                      disabled={isPaymentDetailsDisabled}
                    />
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
                      value={field.value}
                      disabled={isPaymentDetailsDisabled}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccione un método" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(PAYMENT_METHOD_TYPES).map(
                          ([key, label]) => (
                            <SelectItem key={key} value={key}>
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
                name="transactionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Pago</FormLabel>
                    <FormControl>
                      <CustomCalendar
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bankReference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referencia Bancaria</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentDescription"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Descripción del Pago</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </fieldset>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h3 className="text-lg font-semibold">Resumen de Pago</h3>
            <div className="flex justify-between">
              <span>Total de Cuentas:</span>
              <span className="mr-3">{fields.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Cuentas Seleccionadas:</span>
              <span className="mr-3">{selectedAccounts.length}</span>
            </div>
            <div className="flex justify-between text-xl font-bold">
              <span>Monto Total a Pagar:</span>
              <span className="mr-3">{totalAmount.toFixed(2)} Bs</span>
            </div>
          </div>

          <div className="flex justify-end gap-4 mr-3">
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || totalAmount <= 0}>
              {isPending ? 'Procesando...' : 'Procesar Pagos'}
            </Button>
          </div>
        </form>
      </ScrollArea>
    </Form>
  );
}

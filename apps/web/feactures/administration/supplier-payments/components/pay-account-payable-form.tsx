'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/components/ui/button';
import { CustomCalendar } from '@repo/shadcn/components/ui/custom-calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/shadcn/components/ui/form';
import { Input } from '@repo/shadcn/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/components/ui/select';
import { SelectSearchable } from '@repo/shadcn/components/ui/select-searchable';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useBankAccountAll } from '../../../banks/bank-account/hooks/use-query-bank-account';
import {
  PAYMENT_METHOD_TYPES,
  PaymentMethodEnum,
} from '../../supplier-payments/schemas';
import { usePayAccountPayableMutation } from '../hooks';
import {
  PayAccountPayable,
  payAccountPayableSchema,
  PaymentAccountPayable,
} from '../schemas';

import { AlertModal } from '@/components/modal/alert-modal';
import { ScrollArea } from '@repo/shadcn/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/shadcn/table';
import { useEffect, useMemo, useState } from 'react';
import { useAppliedTransactions } from '../../accounts-payable/hooks/use-query-payment-history';
import { useSupplierAvailableCredit } from '../hooks/use-query-supplier-credits-available';

interface FormProps {
  accountPayable: PaymentAccountPayable;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PayAccountPayableForm({
  accountPayable,
  onSuccess,
  onCancel,
}: FormProps) {
  const [isConfirmOpen, setConfirmOpen] = useState(false);

  const { data: bankAccounts, isLoading: isLoadingBankAccounts } =
    useBankAccountAll();
  const { data: availableCreditsData } = useSupplierAvailableCredit(
    accountPayable.supplierId,
  );
  const { data: appliedTransactionsData } = useAppliedTransactions(
    accountPayable.id ?? 0,
  );

  const { mutate: pay, isPending } = usePayAccountPayableMutation();

  const form = useForm<PayAccountPayable>({
    resolver: zodResolver(payAccountPayableSchema),
    defaultValues: {
      supplierId: accountPayable?.supplierId,
      accountsPayableId: accountPayable.id,
      amount: Number(accountPayable.remainingAmount),
      paymentMethod: PaymentMethodEnum.BANK_TRANSFER,
      transactionDate: new Date(),
      appliedCredits: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'appliedCredits',
  });

  const appliedCredits = useWatch({
    control: form.control,
    name: 'appliedCredits',
  });
  const bankPaymentAmount = useWatch({ control: form.control, name: 'amount' });

  const debtBreakdown = useMemo(() => {
    const invoice = {
      document: `Factura ${accountPayable.supplierInvoice?.invoiceNumber || 'N/A'}`,
      amount: Number(accountPayable.originalAmount),
      type: 'INVOICE',
    };
    const transactions = appliedTransactionsData?.data?.map((t: any) => ({
      document: `Nota ${t.transactionNumber}`,
      amount: t.direction === 'DR' ? Number(t.amount) : -Number(t.amount),
      type: t.transactionType,
    }));
    return [invoice, ...(transactions || [])];
  }, [accountPayable, appliedTransactionsData]);

  const totalDebt = useMemo(() => {
    return debtBreakdown.reduce((sum, item) => sum + item.amount, 0);
  }, [debtBreakdown]);

  const totalApplied = useMemo(() => {
    return (
      appliedCredits?.reduce((sum, item) => sum + Number(item.amount), 0) || 0
    );
  }, [appliedCredits]);

  useEffect(() => {
    const netPayment = totalDebt - totalApplied;
    form.setValue('amount', netPayment > 0 ? netPayment : 0);
  }, [totalDebt, totalApplied, form]);

  const onSubmit = (data: PayAccountPayable) => {
    const { supplierName, status, ...rest } = data;
    pay(rest, {
      onSuccess: () => {
        onSuccess?.();
        setConfirmOpen(false);
      },
    });
  };

  const availableDocuments =
    availableCreditsData?.data?.flatMap((sc) => sc.credits) || [];

  const validationError = useMemo(() => {
    if (totalApplied > totalDebt)
      return 'El monto aplicado no puede ser mayor a la deuda total.';
    if (bankPaymentAmount < 0) return 'El pago bancario no puede ser negativo.';
    if (totalApplied + bankPaymentAmount > totalDebt)
      return 'El pago total (aplicado + bancario) excede la deuda.';
    for (const applied of appliedCredits || []) {
      const available = availableDocuments.find(
        (doc) => doc.cxpId === applied.cxpId,
      );
      if (available && applied.amount > available.amount) {
        return `El monto a aplicar del documento ${applied.cxpNumber} excede el saldo disponible.`;
      }
    }
    return null;
  }, [
    totalApplied,
    totalDebt,
    bankPaymentAmount,
    appliedCredits,
    availableDocuments,
  ]);

  if (isLoadingBankAccounts) {
    return <p>Cargando...</p>;
  }

  return (
    <>
      <AlertModal
        isOpen={isConfirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={form.handleSubmit(onSubmit)}
        loading={isPending}
        title="Confirmar Registro de Pago"
        description="¿Está seguro de que desea registrar este pago? Esta acción no se puede deshacer."
        // description={
        //   <div className="text-sm space-y-2 border p-4 rounded-md">
        //     <div className="flex justify-between font-bold text-lg">
        //       <span>DETALLE DEL PAGO</span>
        //     </div>
        //     <div className="flex justify-between">
        //       <span>Deuda total:</span>{' '}
        //       <strong>{totalDebt.toFixed(2)} Bs.</strong>
        //     </div>
        //     <div className="flex justify-between">
        //       <span>Aplicado (Anticipos/NC):</span>{' '}
        //       <strong>{totalApplied.toFixed(2)} Bs.</strong>
        //     </div>
        //     <div className="flex justify-between border-t pt-2 mt-2">
        //       <span>Pago bancario neto:</span>{' '}
        //       <strong className="text-lg">
        //         {bankPaymentAmount.toFixed(2)} Bs.
        //       </strong>
        //     </div>
        //     <div className="flex justify-between">
        //       <span>Cuenta Bancaria:</span>{' '}
        //       <strong>
        //         {
        //           bankAccounts?.data.find(
        //             (b) => b.id === form.getValues('bankAccountId'),
        //           )?.accountName
        //         }
        //       </strong>
        //     </div>
        //     <div className="flex justify-between">
        //       <span>Fecha:</span>{' '}
        //       <strong>
        //         {form.getValues('transactionDate').toLocaleDateString()}
        //       </strong>
        //     </div>
        //     <div className="flex justify-between">
        //       <span>Referencia:</span>{' '}
        //       <strong>{form.getValues('bankReference')}</strong>
        //     </div>
        //   </div>
        // }
      />

      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!validationError) setConfirmOpen(true);
            else alert(validationError); // Replace with a proper toast/alert
          }}
          className="space-y-6"
        >
          <ScrollArea className="h-[calc(100vh-300px)] p-4">
            {/* Debt Breakdown */}
            <div className="p-4 border rounded-lg mb-4">
              <h3 className="font-semibold text-lg mb-2">
                Desglose de la Deuda
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Documento</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {debtBreakdown.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{item.document}</TableCell>
                      <TableCell className="text-right">
                        {item.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-bold">Total a Pagar</TableCell>
                    <TableCell className="text-right font-bold">
                      {totalDebt.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            {/* Available Documents */}
            <div className="p-4 border rounded-lg mb-4">
              <h3 className="font-semibold text-lg mb-2">
                Documentos Disponibles para Aplicar
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Documento</TableHead>
                    <TableHead>Saldo Disponible</TableHead>
                    <TableHead className="w-[150px]">Aplicar</TableHead>
                    <TableHead>Restante</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableDocuments.length > 0 ? (
                    availableDocuments.map((doc) => {
                      const fieldIndex = fields.findIndex(
                        (f) => f.cxpId === doc.cxpId,
                      );
                      const appliedAmount =
                        fieldIndex > -1
                          ? appliedCredits?.[fieldIndex]?.amount || 0
                          : 0;
                      const remaining = doc.amount - appliedAmount;

                      return (
                        <TableRow key={doc.cxpId}>
                          <TableCell>
                            {doc.cxpNumber} ({doc.origin})
                          </TableCell>
                          <TableCell>{doc.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              max={doc.amount}
                              min={0}
                              defaultValue={appliedAmount}
                              onChange={(e) => {
                                const newAmount = Number(e.target.value);
                                const existingIndex = fields.findIndex(
                                  (f) => f.cxpId === doc.cxpId,
                                );
                                if (existingIndex > -1) {
                                  if (newAmount > 0) {
                                    update(existingIndex, {
                                      ...fields[existingIndex],
                                      cxpNumber: doc.cxpNumber,
                                      origin: doc.origin ?? '',
                                      cxpId: doc.cxpId,
                                      amount: newAmount,
                                    });
                                  } else {
                                    remove(existingIndex);
                                  }
                                } else if (newAmount > 0) {
                                  append({
                                    cxpId: doc.cxpId,
                                    amount: newAmount,
                                    origin: doc.origin,
                                    cxpNumber: doc.cxpNumber,
                                  });
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>{remaining.toFixed(2)}</TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        No hay documentos disponibles.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} className="font-bold">
                      Total Aplicado
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {totalApplied.toFixed(2)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            {/* Bank Payment */}
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Pago Bancario</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto a Pagar (Neto)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bankAccountId"
                  render={({ field }) => (
                    <FormItem key={field.value}>
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
                      >
                        <FormControl>
                          <SelectTrigger>
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
                    <FormItem>
                      <FormLabel>Descripción del Pago</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-4 p-4">
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !!validationError}>
              {isPending ? 'Procesando...' : 'Registrar Pago'}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}

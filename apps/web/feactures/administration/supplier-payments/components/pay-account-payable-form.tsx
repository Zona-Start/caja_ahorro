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
import { PayAccountPayable, payAccountPayableSchema } from '../schemas';

import { AlertModal } from '@/components/modal/alert-modal';
import { formatCurrency } from '@/lib/formatCurrent';
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
import { useSupplierAvailableCredit } from '../hooks/use-query-supplier-credits-available';
import { OneSupplierPaymentSchemaAPI } from '../schemas/account-payable-api.schema';

interface FormProps {
  data: OneSupplierPaymentSchemaAPI;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PayAccountPayableForm({
  data,
  onSuccess,
  onCancel,
}: FormProps) {
  const { account: accountPayable, note: notes } = data;
  const [isConfirmOpen, setConfirmOpen] = useState(false);

  const { data: bankAccounts, isLoading: isLoadingBankAccounts } =
    useBankAccountAll();
  const { data: availableCreditsData } = useSupplierAvailableCredit(
    accountPayable.supplierId,
  );

  const { mutate: pay, isPending } = usePayAccountPayableMutation();

  const form = useForm<PayAccountPayable>({
    resolver: zodResolver(payAccountPayableSchema),
    defaultValues: {
      supplierId: accountPayable?.supplierId,
      accountsPayableId: accountPayable.id,
      amount: Number(accountPayable.remaingAmount),
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
      document: `Factura N° ${accountPayable?.invoiceNumber || 'N/A'}`,
      amount: Number(accountPayable.amount),
      type: 'INVOICE',
    };
    const creditNotes =
      notes?.map((note) => ({
        document: `+ Nota de Débito N° ${note.referenceNote}`,
        amount: Math.abs(Number(note.appliedAmount)), // Ensure it's negative
        type: 'NOTE',
      })) || [];
    return [invoice, ...creditNotes];
  }, [accountPayable, notes]);

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
    const { supplierName, status, appliedCredits, accountsPayableId, ...rest } =
      data;

    const payload = {
      ...rest,
      accountPayableId: accountsPayableId,
      creditAplied: appliedCredits?.map((credit) => ({
        id: credit.cxpId,
        transactionType: credit.origin,
        appliedAmount: credit.amount,
      })),
    };

    pay(payload, {
      onSuccess: () => {
        onSuccess?.();
        setConfirmOpen(false);
      },
    });
  };

  const availableDocuments = useMemo(() => {
    return (availableCreditsData?.data || []).map((credit) => ({
      cxpId: credit.id,
      amount: Number(credit.availableAmount),
      origin: credit.transactionType,
      cxpNumber: credit.transactionNumber,
    }));
  }, [availableCreditsData]);

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
      />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(() => {
            if (validationError) {
              // Here you would show a toast
              console.error(validationError);
              alert(validationError); // Placeholder for toast
            } else {
              setConfirmOpen(true);
            }
          })}
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
                        {formatCurrency(item.amount, 'VES')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-bold">Total a Pagar</TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(totalDebt, 'VES')}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            {/* Available Documents */}
            <div className="p-4 border rounded-lg mb-4">
              <h3 className="font-semibold text-lg mb-2">
                Créditos y Anticipos Disponibles
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Documento</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Saldo Disponible</TableHead>
                    <TableHead className="w-[150px]">Monto a Aplicar</TableHead>
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
                          <TableCell>{doc.cxpNumber}</TableCell>
                          <TableCell>{doc.origin}</TableCell>
                          <TableCell>
                            {formatCurrency(doc.amount, 'VES')}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              max={doc.amount}
                              min={0}
                              defaultValue={appliedAmount}
                              onChange={(e) => {
                                let newAmount = Number(e.target.value);

                                if (newAmount > doc.amount) {
                                  newAmount = doc.amount;
                                  e.target.value = newAmount.toString();
                                } else if (newAmount < 0) {
                                  newAmount = 0;
                                  e.target.value = newAmount.toString();
                                }

                                const existingIndex = fields.findIndex(
                                  (f) => f.cxpId === doc.cxpId,
                                );

                                if (existingIndex > -1) {
                                  if (newAmount > 0) {
                                    update(existingIndex, {
                                      cxpId: doc.cxpId,
                                      origin: doc.origin,
                                      cxpNumber: doc.cxpNumber,
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
                          <TableCell>
                            {formatCurrency(remaining, 'VES')}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No hay créditos o anticipos disponibles.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="font-bold">
                      Total Aplicado
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(totalApplied, 'VES')}
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

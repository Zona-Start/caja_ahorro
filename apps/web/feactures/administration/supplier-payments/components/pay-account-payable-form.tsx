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

import { ScrollArea } from '@repo/shadcn/scroll-area';
import { Switch } from '@repo/shadcn/switch';
import { useEffect, useMemo, useState } from 'react';
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
  const [chargeAdvances, setChargeAdvances] = useState(false);

  //consulta de tados del banco
  const { data: bankAccounts, isLoading: isLoadingBankAccounts } =
    useBankAccountAll();

  //lamada de  hook consular anticipos activos por proveedor
  const { data: advances } = useSupplierAvailableCredit(
    accountPayable.supplierId,
  );

  //llamada a hook para mutar datos
  const { mutate: pay, isPending } = usePayAccountPayableMutation();

  const form = useForm<PayAccountPayable>({
    resolver: zodResolver(payAccountPayableSchema),
    defaultValues: {
      supplierId: accountPayable?.supplierId,
      supplierName: accountPayable?.supplierName,
      accountsPayableId: accountPayable.id,
      amount: 0,
      paymentMethod: PaymentMethodEnum.BANK_TRANSFER,
      transactionDate: new Date(),
      paymentDescription: '',
      bankAccountId: undefined,
      bankReference: undefined,
      appliedCredits: [],
      status: accountPayable.status,
    },
  });

  const {
    fields: advanceFields,
    append: appendAdvance,
    remove: removeAdvance,
  } = useFieldArray({
    control: form.control,
    name: 'appliedCredits',
  });

  const appliedCredits = useWatch({
    control: form.control,
    name: 'appliedCredits',
  });

  const totalAppliedAdvance = useMemo(() => {
    return (
      appliedCredits?.reduce(
        (acc, advance) => acc + (advance.amount || 0),
        0,
      ) || 0
    );
  }, [appliedCredits]);

  useEffect(() => {
    if (isLoadingBankAccounts) return;

    let initialValues;
    initialValues = {
      supplierId: accountPayable.supplierId,
      accountsPayableId: accountPayable.id,
      amount: Number(accountPayable.remainingAmount),
      paymentMethod: PaymentMethodEnum.BANK_TRANSFER,
      transactionDate: new Date(),
      paymentDescription: undefined,
      bankAccountId: undefined,
      bankReference: undefined,
    };
    form.reset({
      ...initialValues,
      bankAccountId: initialValues.bankAccountId || undefined,
      bankReference: initialValues.bankReference || undefined,
      appliedCredits: [],
    });
  }, [bankAccounts, isLoadingBankAccounts, accountPayable, form.reset]);

  useEffect(() => {
    const remainingAmount =
      Number(accountPayable.remainingAmount) - totalAppliedAdvance;
    form.setValue('amount', remainingAmount > 0 ? remainingAmount : 0);
  }, [totalAppliedAdvance, accountPayable.remainingAmount, form]);

  const onSubmit = (data: PayAccountPayable) => {
    const { supplierName, status, ...rest } = data;

    pay(rest, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  if (isLoadingBankAccounts) {
    return <p>Cargando información de pago...</p>;
  }

  return (
    <Form {...form}>
      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="space-y-2 text-sm mb-4 p-2 bg-muted rounded-md">
          <div className="flex justify-between">
            <strong>Proveedor:</strong>
            <span>{accountPayable?.supplierName}</span>
          </div>
          <div className="flex justify-between">
            <strong>Factura:</strong>
            <span>
              {accountPayable.supplierInvoice?.invoiceNumber ?? 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <strong>Saldo Pendiente:</strong>
            <span className="font-bold">
              {Number(accountPayable.remainingAmount).toFixed(2)}
            </span>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {accountPayable.status !== 'ADVANCE' && (
            <div className="space-y-4 border p-4 rounded-md">
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <FormLabel>Aplicar Anticipos</FormLabel>
                <FormControl>
                  <Switch
                    checked={chargeAdvances}
                    onCheckedChange={(checked) => {
                      setChargeAdvances(checked);
                      if (!checked) {
                        form.setValue('appliedCredits', []);
                      }
                    }}
                    disabled={!accountPayable.supplierId}
                  />
                </FormControl>
              </FormItem>
              {chargeAdvances && (
                <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                  {advances?.data &&
                  advances.data.flatMap((sc) => sc.credits).length > 0 ? (
                    advances.data
                      .flatMap((supplierCredit) => supplierCredit.credits)
                      .map((credit: any) => {
                        const advanceIndex = advanceFields.findIndex(
                          (field) => field.cxpId === credit.cxpId,
                        );
                        const isSelected = advanceIndex !== -1;

                        return (
                          <div
                            key={credit.cxpId}
                            className="flex items-center justify-between p-2 mb-2 border rounded-md"
                          >
                            <div className="flex items-center gap-4">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    appendAdvance({
                                      cxpId: credit.cxpId,
                                      amount: 0,
                                      origin: credit.origin,
                                      cxpNumber: credit.cxpNumber,
                                    });
                                  } else {
                                    removeAdvance(advanceIndex);
                                  }
                                }}
                              />
                              <div className="flex flex-col">
                                <span className="font-semibold">
                                  {credit.cxpNumber}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {credit.origin === 'ADVANCE'
                                    ? 'AVANCE'
                                    : 'NOTA CREDITO'}{' '}
                                  - Saldo: {Number(credit.amount).toFixed(2)}{' '}
                                  Bs.
                                </span>
                              </div>
                            </div>
                            {isSelected && (
                              <FormField
                                control={form.control}
                                name={`appliedCredits.${advanceIndex}.amount`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Monto a aplicar</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        {...field}
                                        max={credit.amount}
                                        min={0}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            )}
                          </div>
                        );
                      })
                  ) : (
                    <div className="text-center text-muted-foreground">
                      No hay anticipos disponibles para este proveedor.
                    </div>
                  )}
                </ScrollArea>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto a Pagar</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      disabled={accountPayable.status === 'ADVANCE'}
                    />
                  </FormControl>
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Procesando...' : 'Confirmar Pago'}
            </Button>
          </div>
        </form>
      </ScrollArea>
    </Form>
  );
}

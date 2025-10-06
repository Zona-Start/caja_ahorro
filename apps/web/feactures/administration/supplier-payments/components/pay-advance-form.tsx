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
import { useForm } from 'react-hook-form';
import { useBankAccountAll } from '../../../banks/bank-account/hooks/use-query-bank-account';
import { usePayAdvanceMutation } from '../hooks';
import {
  PayAdvance,
  payAdvanceSchema,
  PAYMENT_METHOD_TYPES,
  PaymentMethodEnum,
} from '../schemas';

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
import { useState } from 'react';
import { AccountPayableSchemaAPI } from '../schemas/account-payable-api.schema';

interface FormProps {
  advance: AccountPayableSchemaAPI;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PayAdvanceForm({ advance, onSuccess, onCancel }: FormProps) {
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const { data: bankAccounts, isLoading: isLoadingBankAccounts } =
    useBankAccountAll(); //busqueda de bancos
  const { mutate: pay, isPending } = usePayAdvanceMutation(); //mutacion para enviar datos al backend

  const form = useForm<PayAdvance>({
    resolver: zodResolver(payAdvanceSchema),
    defaultValues: {
      supplierId: advance?.supplierId!,
      supplierName: advance?.supplierName!,
      transactionId: advance?.id,
      amount: Number(advance.amount),
      paymentMethod: PaymentMethodEnum.BANK_TRANSFER,
      transactionDate: new Date(),
    },
  });
  const onSubmit = (data: PayAdvance) => {
    const { supplierName, ...rest } = data;
    pay(rest, {
      onSuccess: () => {
        onSuccess?.();
        setConfirmOpen(false);
      },
    });
  };

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
          onSubmit={form.handleSubmit(() => setConfirmOpen(true))}
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
                  <TableRow>
                    <TableCell>Anticipo: {advance.reference}</TableCell>
                    <TableCell className="text-right">
                      {advance.amount}
                    </TableCell>
                  </TableRow>
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-bold">Total a Pagar</TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(Number(advance.amount), 'VES')}
                    </TableCell>
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
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Procesando...' : 'Registrar Pago'}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}

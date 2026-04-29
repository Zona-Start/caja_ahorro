'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import { Checkbox } from '@repo/shadcn/components/ui/checkbox';
import { MultiSelect } from '@repo/shadcn/components/ui/multi-select';
import { Form, FormItem, FormLabel, FormMessage } from '@repo/shadcn/form';
import { ScrollArea } from '@repo/shadcn/scroll-area';
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
import { useSupplierAll } from '../../suppliers/hooks/use-query-suppliers';
import { useReversePaymentMutation } from '../hooks/use-mutation-supplier-payment';
import { useSupplierPayments } from '../hooks/use-query-supplier-payment';
import {
  ReversePayment,
  reversePaymentSchema,
} from '../schemas/reverse-payment.schema';

interface FormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReversePaymentForm({ onSuccess, onCancel }: FormProps) {
  const { mutate: reversePayment, isPending } = useReversePaymentMutation();
  const { data: suppliers } = useSupplierAll();

  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);

  const actualSupplierIds = useMemo(() => {
    if (selectedSuppliers.includes('all')) {
      return suppliers?.map((s) => Number(s.id)) || [];
    }
    return selectedSuppliers.map((id) => Number(id));
  }, [selectedSuppliers, suppliers]);

  const { data: supplierPayments, isLoading: isLoadingSupplierPayments } =
    useSupplierPayments({
      status: ['PROCESSED'],
    });

  const form = useForm<ReversePayment>({
    resolver: zodResolver(reversePaymentSchema),
    defaultValues: {
      payments: [],
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: 'payments',
  });

  useEffect(() => {
    if (actualSupplierIds.length === 0) {
      replace([]);
      return;
    }
    if (supplierPayments?.data) {
      const newPayments = supplierPayments.data.map((p: any) => ({
        id: p.id,
        selected: false,
        paymentNumber: p.paymentNumber,
        supplierName: p.supplierName,
        totalAmount: p.totalAmount,
        accountPayableNumber: p.accountPayableNumber,
        status: p.status,
        requestedAt: p.requestedAt,
      }));
      replace(newPayments);
    }
  }, [supplierPayments, replace, actualSupplierIds]);

  const selectedPayments = form.watch('payments').filter((p) => p.selected);

  console.log(form.formState.errors);
  const onSubmit = (data: ReversePayment) => {
    const selectedPaymentIds = data.payments
      .filter((p) => p.selected)
      .map((p) => p.id);

    if (selectedPaymentIds.length === 0) {
      return;
    }

    reversePayment(
      { paymentIds: selectedPaymentIds },
      {
        onSuccess: () => {
          onSuccess?.();
        },
      },
    );
  };

  const supplierOptions = useMemo(() => {
    const allOptions =
      suppliers?.map((s) => ({
        value: s.id!.toString(),
        label: s.name,
      })) || [];
    return [{ value: 'all', label: 'Seleccionar Todos' }, ...allOptions];
  }, [suppliers]);

  const handleSupplierChange = (values: string[]) => {
    if (values.includes('all')) {
      const allSupplierIds = suppliers?.map((s) => s.id!.toString()) || [];
      setSelectedSuppliers(['all', ...allSupplierIds]);
    } else {
      setSelectedSuppliers(values.filter((value) => value !== 'all'));
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
                        selectedPayments.length === fields.length
                      }
                      onCheckedChange={(checked) => {
                        const updatedPayments = form
                          .getValues('payments')
                          .map((p) => ({ ...p, selected: !!checked }));
                        form.setValue('payments', updatedPayments);
                      }}
                    />
                  </TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingSupplierPayments ? (
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
                          name={`payments.${index}.selected`}
                          render={({ field: controllerField }) => (
                            <Checkbox
                              checked={controllerField.value}
                              onCheckedChange={controllerField.onChange}
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        {form.getValues(`payments.${index}`).paymentNumber}
                      </TableCell>
                      <TableCell>
                        {form.getValues(`payments.${index}`).supplierName}
                      </TableCell>
                      <TableCell>
                        {new Date(
                          form.getValues(`payments.${index}`).requestedAt,
                        ).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {form.getValues(`payments.${index}`).totalAmount}
                      </TableCell>
                      <TableCell>
                        {form.getValues(`payments.${index}`).status}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>

          <div className="flex justify-end gap-4 mr-3">
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending || selectedPayments.length === 0}
            >
              {isPending ? 'Procesando...' : 'Reversar Pagos'}
            </Button>
          </div>
        </form>
      </ScrollArea>
    </Form>
  );
}

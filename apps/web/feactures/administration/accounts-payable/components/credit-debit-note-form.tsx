'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import { SelectSearchable } from '@repo/shadcn/components/ui/select-searchable';
import { Textarea } from '@repo/shadcn/components/ui/textarea';
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
import { useForm } from 'react-hook-form';
import { useSupplierAll } from '../../suppliers/hooks/use-query-suppliers';
import { useAccountsPayable } from '../hooks';
import { useCreditDebitNoteMutation } from '../hooks/use-mutation-credit-debit-note';
import {
  CreditDebitNote,
  creditDebitNoteSchema,
} from '../schemas/credit-debit-note.schema';

interface FormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreditDebitNoteForm({ onSuccess, onCancel }: FormProps) {
  const { mutate: saveCreditDebitNote, isPending: isSaving } =
    useCreditDebitNoteMutation();

  const form = useForm<CreditDebitNote>({
    resolver: zodResolver(creditDebitNoteSchema),
    defaultValues: {
      transactionType: 'CREDIT_NOTE',
      amount: 0,
      reason: '',
      observations: '',
    },
    mode: 'onChange',
  });

  const transactionType = form.watch('transactionType');
  const supplierId = form.watch('supplierId');

  const { data: accountsPayable, isLoading: isLoadingAccountsPayable } =
    useAccountsPayable({
      status: 'PENDING,IN_PROGRESS,PAID,EXPIRED',
      supplierId: supplierId,
    });

  const { data: suppliers } = useSupplierAll();

  const onSubmit = async (data: CreditDebitNote) => {
    saveCreditDebitNote(data, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
      onError: (error) => {
        form.setError('root', {
          type: 'manual',
          message: error.message || 'Error al guardar la nota',
        });
      },
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 h-full p-4"
      >
        {form.formState.errors.root && (
          <div className="text-destructive text-sm">
            {form.formState.errors.root.message}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="transactionType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Transacción</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccione un tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="CREDIT_NOTE">Nota de Crédito</SelectItem>
                    <SelectItem value="DEBIT_NOTE">Nota de Débito</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="supplierId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proveedor</FormLabel>
                <SelectSearchable
                  options={
                    suppliers?.map((item) => ({
                      value: item.id!.toString(),
                      label: item.name,
                    })) || []
                  }
                  onValueChange={(value) => {
                    field.onChange(Number(value));
                    form.resetField('accountsPayableId');
                  }}
                  placeholder="Selecciona un proveedor"
                  defaultValue={field.value?.toString()}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="accountsPayableId"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>
                  {transactionType === 'CREDIT_NOTE'
                    ? 'Cuentas por pagar (opcional)'
                    : 'Cuentas por pagar'}
                </FormLabel>
                <SelectSearchable
                  disabled={!supplierId}
                  options={
                    accountsPayable?.data?.map((item: any) => ({
                      value: item.id!.toString(),
                      label: `${item.accountsPayableNumber} - ${item.supplierName}`,
                    })) || []
                  }
                  onValueChange={(value) => field.onChange(Number(value))}
                  placeholder="Selecciona una cuenta por pagar"
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
                <FormLabel>Monto</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Concepto o Motivo</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="observations"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observaciones</FormLabel>
                <FormControl>
                  <Textarea {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="sticky bottom-0 w-full bg-background py-2 px-6 mt-auto">
          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Registrar Nota'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

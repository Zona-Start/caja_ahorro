'use client';

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
import { CustomCalendar } from '@repo/shadcn/custom-calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { useForm } from 'react-hook-form';
import {
  useTransactionTypeMutation,
} from '../hooks/use-mutation-transaction-type';
import { TransactionType, transactionTypeSchema } from '../schemas/transaction-type.schema';
import { useAccountingAccounts } from '@/feactures/accounting/accounting-accounts/hooks/use-query-account-plan';

interface TransactionTypeFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<TransactionType>;
  readOnly?: boolean;
}

export function TransactionTypeForm({
  onSuccess,
  onCancel,
  defaultValues,
  readOnly = false,
}: TransactionTypeFormProps) {
  const {
    mutate: saveTransactionType,
    isPending: isSaving,
    isError,
  } = useTransactionTypeMutation();

  const { data: AccoutingAccountsPlans } = useAccountingAccounts();

  const form = useForm<TransactionType>({
    resolver: zodResolver(transactionTypeSchema),
    defaultValues: {
      id: defaultValues?.id,
      code: defaultValues?.code || '',
      description: defaultValues?.description || '',
      deferredDate: defaultValues?.deferredDate ? new Date(defaultValues.deferredDate) : null,
      dateCanceled: defaultValues?.dateCanceled ? new Date(defaultValues.dateCanceled) : null,
      deferredNumber: defaultValues?.deferredNumber || null,
      numberCanceled: defaultValues?.numberCanceled || null,
      associatedAccount: defaultValues?.associatedAccount || null,
      employerAccount: defaultValues?.employerAccount || null,
      loanAccount: defaultValues?.loanAccount || null,
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: TransactionType) => {
    
    
    const formData = {
      ...data,
      deferredDate: data.deferredDate ? data.deferredDate.toISOString().split('T')[0] : null,
      dateCanceled: data.dateCanceled ? data.dateCanceled.toISOString().split('T')[0] : null,
      deferredNumber: data.deferredNumber ? Number(data.deferredNumber) : null,
      numberCanceled: data.numberCanceled ? Number(data.numberCanceled) : null,
      associatedAccount: data.associatedAccount ? Number(data.associatedAccount) : null,
      employerAccount: data.employerAccount ? Number(data.employerAccount) : null,
      loanAccount: data.loanAccount ? Number(data.loanAccount) : null,
    } as TransactionType;

    saveTransactionType(formData, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
      onError: () => {
        form.setError('root', {
          type: 'manual',
          message: 'Error al guardar el tipo de transacción',
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
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código</FormLabel>
                <FormControl>
                  <Input placeholder="001" {...field} disabled={readOnly}  className={readOnly ? "bg-muted" : ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Input {...field} disabled={readOnly}  className={readOnly ? "bg-muted" : ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />


          <FormField
            control={form.control}
            name="deferredDate"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Fecha diferida (opcional)</FormLabel>
                <FormControl>
                  <CustomCalendar
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Seleccione la fecha"
                    disabled={readOnly}  className={readOnly ? "bg-muted" : ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

            <FormField
              control={form.control}
              name="dateCanceled"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Fecha cancelada (opcional)</FormLabel>
                  <FormControl>
                    <CustomCalendar
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Seleccione la fecha"
                      disabled={readOnly}  className={readOnly ? "bg-muted" : ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

        <FormField
            control={form.control}
            name="deferredNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>N° Diferido</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    placeholder="00"  
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    value={field.value ?? ''}
                    disabled={readOnly}  className={readOnly ? "bg-muted" : ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="numberCanceled"
            render={({ field }) => (
              <FormItem>
                <FormLabel>N° Cancelado</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    placeholder="00"  
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    value={field.value ?? ''}
                    disabled={readOnly}  className={readOnly ? "bg-muted" : ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="associatedAccount"
            render={({ field }) => (
              <FormItem className="col-span-2 w-full">
                <FormLabel>Cuenta Asociado</FormLabel>
                <Select
                  onValueChange={(value) =>
                    field.onChange(value === 'null' ? null : Number(value))
                  }
                  defaultValue={field.value?.toString() || 'null'}
                  disabled={readOnly}  
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona cuenta contable" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="w-full min-w-[200px] max-h-[200px] overflow-y-auto">
                    <SelectItem value="null">Ninguno</SelectItem>
                    {AccoutingAccountsPlans?.data?.map((account) => (
                      <SelectItem
                        key={account.id}
                        value={account.id!.toString()}
                        className={readOnly ? "bg-muted" : ""}
                      >
                        {account.code} - {account.name}
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
            name="employerAccount"
            render={({ field }) => (
              <FormItem className="col-span-2 w-full">
                <FormLabel>Cuenta Patrono</FormLabel>
                <Select
                  onValueChange={(value) =>
                    field.onChange(value === 'null' ? null : Number(value))
                  }
                  defaultValue={field.value?.toString() || 'null'}
                  disabled={readOnly}  
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona cuenta contable" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="w-full min-w-[200px] max-h-[200px] overflow-y-auto">
                    <SelectItem value="null">Ninguno</SelectItem>
                    {AccoutingAccountsPlans?.data?.map((account) => (
                      <SelectItem
                        key={account.id}
                        value={account.id!.toString()}
                        className={readOnly ? "bg-muted" : ""}
                      >
                        {account.code} - {account.name}
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
            name="loanAccount"
            render={({ field }) => (
              <FormItem className="col-span-2 w-full">
                <FormLabel>Cuenta Prestamo</FormLabel>
                <Select
                  onValueChange={(value) =>
                    field.onChange(value === 'null' ? null : Number(value))
                  }
                  defaultValue={field.value?.toString() || 'null'}
                  disabled={readOnly}  
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona cuenta contable" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="w-full min-w-[200px] max-h-[200px] overflow-y-auto">
                    <SelectItem value="null">Ninguno</SelectItem>
                    {AccoutingAccountsPlans?.data?.map((account) => (
                      <SelectItem
                        key={account.id}
                        value={account.id!.toString()}
                        className={readOnly ? "bg-muted" : ""}
                      >
                        {account.code} - {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancelar
          </Button>
          {!readOnly && (
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Guardando..." : "Guardar"}
              </Button>
            )}
        </div>
      </form>
    </Form>
  );
}

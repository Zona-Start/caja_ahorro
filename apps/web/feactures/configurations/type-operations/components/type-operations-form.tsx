'use client';

import { useAccountingAccounts } from '@/feactures/accounting/accounting-accounts/hooks/use-query-account-plan';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import { CustomCalendar } from '@repo/shadcn/custom-calendar';
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
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTypeOperationsMutation } from '../hooks/use-mutation-type-operations';
import { GROUP_TYPES } from '../schemas/type-operations-options';
import {
  TypeOperations,
  typeOperationsSchema,
} from '../schemas/type-operations.schema';

interface TypeOperationsFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<TypeOperations>;
  readOnly?: boolean;
}

export function TypeOperationsForm({
  onSuccess,
  onCancel,
  defaultValues,
  readOnly = false,
}: TypeOperationsFormProps) {
  const { mutate: saveTypeOperations, isPending: isSaving } =
    useTypeOperationsMutation();

  const { data: AccoutingAccountsPlans } = useAccountingAccounts();

  const [selectedGroup, setSelectedGroup] = useState(
    defaultValues?.group || 'ASSETS',
  );

  const form = useForm<TypeOperations>({
    resolver: zodResolver(typeOperationsSchema),
    defaultValues: {
      id: defaultValues?.id,
      code: defaultValues?.code || '',
      description: defaultValues?.description || '',
      deferredDate: defaultValues?.deferredDate || null,
      dateCanceled: defaultValues?.dateCanceled || null,
      deferredNumber: defaultValues?.deferredNumber || null,
      numberCanceled: defaultValues?.numberCanceled || null,
      associatedAccount: defaultValues?.associatedAccount || null,
      employerAccount: defaultValues?.employerAccount || null,
      loanAccount: defaultValues?.loanAccount || null,
      group: defaultValues?.group || 'ASSETS',
      metadata:
        defaultValues?.group !== 'LOANS'
          ? defaultValues?.metadata
          : {
              ...defaultValues?.metadata[0],
              interestRateAnnual:
                defaultValues?.metadata[0]?.interestRateAnnual || 12,
              maxLoanAmount: defaultValues?.metadata[0]?.maxLoanAmount || null,
              minLoanAmount: defaultValues?.metadata[0]?.minLoanAmount || null,
              termMonthsMin: defaultValues?.metadata[0]?.termMonthsMin || 12,
              termMonthsMax: defaultValues?.metadata[0]?.termMonthsMax || 36,
            },
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (selectedGroup === 'LOANS') {
      form.setValue(
        'metadata.interestRateAnnual',
        form.getValues('metadata.interestRateAnnual') || 12,
      );
      form.setValue(
        'metadata.termMonthsMin',
        form.getValues('metadata.termMonthsMin') || 12,
      );
      form.setValue(
        'metadata.termMonthsMax',
        form.getValues('metadata.termMonthsMax') || 36,
      );
    }
  }, [selectedGroup, form]);

  const onSubmit = async (data: TypeOperations) => {
    if (selectedGroup === GROUP_TYPES.LOANS) {
      if (
        !data.metadata.interestRateAnnual ||
        !data.metadata.termMonthsMin ||
        !data.metadata.termMonthsMax
      ) {
        form.setError('root', {
          type: 'manual',
          message: 'campo requeridos',
        });
        return;
      }
    }

    const formData = {
      ...data,
      deferredDate: data.deferredDate
        ? (data.deferredDate as Date).toISOString().split('T')[0]
        : null,
      dateCanceled: data.dateCanceled
        ? (data.dateCanceled as Date).toISOString().split('T')[0]
        : null,
      deferredNumber: data.deferredNumber ? Number(data.deferredNumber) : null,
      numberCanceled: data.numberCanceled ? Number(data.numberCanceled) : null,
      associatedAccount: data.associatedAccount
        ? Number(data.associatedAccount)
        : null,
      employerAccount: data.employerAccount
        ? Number(data.employerAccount)
        : null,
      loanAccount: data.loanAccount ? Number(data.loanAccount) : null,
      metadata:
        selectedGroup !== GROUP_TYPES.LOANS
          ? null
          : [
              {
                ...data.metadata,
                interestRateAnnual: data.metadata?.interestRateAnnual || 12,
                maxLoanAmount: data.metadata?.maxLoanAmount || null,
                minLoanAmount: data.metadata?.minLoanAmount || null,
                termMonthsMin: data.metadata?.termMonthsMin || 12,
                termMonthsMax: data.metadata?.termMonthsMax || 36,
              },
            ],
    } as TypeOperations;

    saveTypeOperations(formData, {
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
                  <Input
                    placeholder="001"
                    {...field}
                    disabled={readOnly}
                    className={readOnly ? 'bg-muted' : ''}
                  />
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
                  <Input
                    {...field}
                    disabled={readOnly}
                    className={readOnly ? 'bg-muted' : ''}
                  />
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
                    onChange={
                      (date) => field.onChange(date ? date : null) // Usar la fecha seleccionada directamente sin convertirla a UTC
                    }
                    onBlur={field.onBlur}
                    placeholder="Seleccione la fecha"
                    disabled={readOnly}
                    className={readOnly ? 'bg-muted' : ''}
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
                    onChange={
                      (date) => field.onChange(date ? date : null) // Usar la fecha seleccionada directamente sin convertirla a UTC
                    }
                    onBlur={field.onBlur}
                    placeholder="Seleccione la fecha"
                    disabled={readOnly}
                    className={readOnly ? 'bg-muted' : ''}
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
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    value={field.value ?? ''}
                    disabled={readOnly}
                    className={readOnly ? 'bg-muted' : ''}
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
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    value={field.value ?? ''}
                    disabled={readOnly}
                    className={readOnly ? 'bg-muted' : ''}
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
                <SelectSearchable
                  options={
                    AccoutingAccountsPlans?.data?.map((account) => ({
                      value: account.id!.toString(),
                      label: `${account.code} - ${account.name}`,
                    })) || []
                  }
                  onValueChange={(value) =>
                    field.onChange(value === 'null' ? null : Number(value))
                  }
                  placeholder="Selecciona cuenta contable"
                  defaultValue={field.value?.toString() || 'null'}
                  disabled={readOnly}
                />
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
                <SelectSearchable
                  options={
                    AccoutingAccountsPlans?.data?.map((account) => ({
                      value: account.id!.toString(),
                      label: `${account.code} - ${account.name}`,
                    })) || []
                  }
                  onValueChange={(value) =>
                    field.onChange(value === 'null' ? null : Number(value))
                  }
                  placeholder="Selecciona cuenta contable"
                  defaultValue={field.value?.toString() || 'null'}
                  disabled={readOnly}
                />
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
                <SelectSearchable
                  options={
                    AccoutingAccountsPlans?.data?.map((account) => ({
                      value: account.id!.toString(),
                      label: `${account.code} - ${account.name}`,
                    })) || []
                  }
                  onValueChange={(value) =>
                    field.onChange(value === 'null' ? null : Number(value))
                  }
                  placeholder="Selecciona cuenta contable"
                  defaultValue={field.value?.toString() || 'null'}
                  disabled={readOnly}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="group"
            render={({ field }) => (
              <FormItem className="col-span-2 w-full">
                <FormLabel>Grupo</FormLabel>
                <Select
                  onValueChange={(value) => {
                    setSelectedGroup(value);
                    field.onChange(value); // Asignar el valor seleccionado directamente al campo `group`
                  }}
                  value={field.value}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccione un grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(GROUP_TYPES).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedGroup === GROUP_TYPES.LOANS && (
            <>
              <FormField
                control={form.control}
                name="metadata.interestRateAnnual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tasa interés anual</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                        value={field.value ?? ''}
                        disabled={readOnly}
                        className={readOnly ? 'bg-muted' : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="metadata.maxLoanAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto Máximo Permitido</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                        value={field.value ?? ''}
                        disabled={readOnly}
                        className={readOnly ? 'bg-muted' : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="metadata.minLoanAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto Mínimo Permitido</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                        value={field.value ?? ''}
                        disabled={readOnly}
                        className={readOnly ? 'bg-muted' : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="metadata.termMonthsMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duración mínima en meses</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                        value={field.value ?? ''}
                        disabled={readOnly}
                        className={readOnly ? 'bg-muted' : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="metadata.termMonthsMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duración máxima en meses</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                        value={field.value ?? ''}
                        disabled={readOnly}
                        className={readOnly ? 'bg-muted' : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </div>

        <div className="flex justify-end gap-4 sticky bottom-0 bg-background py-4">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancelar
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

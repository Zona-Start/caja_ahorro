'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import { CustomCalendar } from '@repo/shadcn/components/ui/custom-calendar';
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
import { useAccountingCycleMutation } from '../hooks/use-accounting-cycle-mutation';
import {
  CYCLE_STATUS_OPTIONS,
  CycleStatusEnum,
} from '../schemas/accounting-cycle-options';
import {
  AccountingCycle,
  accountingCycleSchema,
} from '../schemas/accounting-cycle.schema';

interface AccountingCycleFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<AccountingCycle>;
}

export function AccountingCycleForm({
  onSuccess,
  onCancel,
  defaultValues,
}: AccountingCycleFormProps) {
  const { mutate: saveAccountingCycle, isPending: isSaving } =
    useAccountingCycleMutation();

  const form = useForm<AccountingCycle>({
    resolver: zodResolver(accountingCycleSchema),
    defaultValues: {
      id: defaultValues?.id,
      companyId: defaultValues?.companyId || 1,
      description: defaultValues?.description || '',
      startDate: defaultValues?.startDate
        ? new Date(defaultValues.startDate)
        : new Date(),
      endDate: defaultValues?.endDate
        ? new Date(defaultValues.endDate)
        : new Date(),
      status: defaultValues?.status || CycleStatusEnum.OPEN,
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: AccountingCycle) => {
    saveAccountingCycle(data, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
      onError: () => {
        form.setError('root', {
          type: 'manual',
          message: 'Error al guardar el ciclo contable',
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
            name="description"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Input placeholder="Ciclo Contable Enero 2025" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Fecha de Inicio</FormLabel>
                <FormControl>
                  <CustomCalendar
                    value={field.value || null}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Seleccione la fecha"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Fecha de Fin</FormLabel>
                <FormControl>
                  <CustomCalendar
                    value={field.value || null}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Seleccione la fecha"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Estado</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={!!defaultValues?.id}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="w-full min-w-[200px]">
                    {Object.entries(CYCLE_STATUS_OPTIONS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
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
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

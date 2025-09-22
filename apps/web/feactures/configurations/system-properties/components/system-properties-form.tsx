'use client';

import { useSystemConfigStore } from '@/store/SystemConfigStore';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { useForm } from 'react-hook-form';
import { useSettingSystemMutation } from '../hooks/use-system-properties-mutation';
import {
  SettingSystem,
  settingSystemSchema,
} from '../schemas/system-properties.schema';

interface SettingSystemFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<SettingSystem>;
}

export function SettingSystemForm({
  onSuccess,
  onCancel,
  defaultValues,
}: SettingSystemFormProps) {
  const { mutate: saveSettingSystem, isPending: isSaving } =
    useSettingSystemMutation();

  const { currencies } = useSystemConfigStore();

  const form = useForm<SettingSystem>({
    resolver: zodResolver(settingSystemSchema),
    defaultValues: {
      key: defaultValues?.key || '',
      description: defaultValues?.description || '',
      value: defaultValues?.value || '',
      group: defaultValues?.group || '',
      id: defaultValues?.id,
    },
  });

  const onSubmit = async (data: SettingSystem) => {
    saveSettingSystem(data, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
      onError: () => {
        form.setError('root', {
          type: 'manual',
          message: 'Error al guardar la propiedad del sistema',
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
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} disabled />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor</FormLabel>
                <FormControl>
                  {form.getValues('key') === 'MONEDA' ? (
                    <Select
                      onValueChange={(value) => field.onChange(value)}
                      value={field.value}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccione una moneda" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem
                            key={currency.id}
                            value={currency.id.toString()}
                          >
                            {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input {...field} />
                  )}
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
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

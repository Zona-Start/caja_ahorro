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
import { useForm } from 'react-hook-form';
import { useSaveCurrencyMutation } from '../hooks/use-currencies-mutations';
import {
  type CurrencyMutation,
  currencyMutationSchema,
} from '../schemas/currencies.schema';

interface CurrenciesFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<CurrencyMutation>;
  disabled?: boolean;
}

const CODE_OPTIONS = [
  { value: 'VES', label: 'VES - Bolívar' },
  { value: 'USD', label: 'USD - Dólar' },
  { value: 'EUR', label: 'EUR - Euro' },
];

export function CurrenciesForm({
  onSuccess,
  onCancel,
  defaultValues,
  disabled = false,
}: CurrenciesFormProps) {
  const { mutate: saveCurrency, isPending: isSaving } = useSaveCurrencyMutation();

  const form = useForm<CurrencyMutation>({
    resolver: zodResolver(currencyMutationSchema),
    defaultValues: {
      id: defaultValues?.id,
      code: defaultValues?.code || 'VES',
      name: defaultValues?.name || '',
      symbol: defaultValues?.symbol || '',
      isBase: defaultValues?.isBase ?? false,
      isActive: defaultValues?.isActive ?? true,
      decimalPlaces: defaultValues?.decimalPlaces ?? 2,
    },
  });

  const onSubmit = (data: CurrencyMutation) => {
    saveCurrency(data, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código</FormLabel>
                <FormControl>
                  <Input
                    placeholder="VES"
                    {...field}
                    disabled={disabled}
                    list="code-options"
                  />
                </FormControl>
                <datalist id="code-options">
                  {CODE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} />
                  ))}
                </datalist>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="symbol"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Símbolo</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Bs., $, €"
                    {...field}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Bolívar Soberano"
                    {...field}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="decimalPlaces"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Decimales</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="2"
                    {...field}
                    disabled={disabled}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isBase"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Moneda Base
                  </FormLabel>
                  <FormMessage />
                </div>
                <FormControl>
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    disabled={disabled}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Activa
                  </FormLabel>
                  <FormMessage />
                </div>
                <FormControl>
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    disabled={disabled}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4 pt-4">
          {disabled ? (
            <Button type="button" onClick={onCancel}>
              Cerrar
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar'}
              </Button>
            </>
          )}
        </div>
      </form>
    </Form>
  );
}
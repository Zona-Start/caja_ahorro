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
import { useSetManualRateMutation } from '../hooks/use-exchange-rates';
import {
  type ManualRateInput,
  manualRateSchema,
} from '../schemas/exchange-rates.schema';

export function ExchangeRatesForm() {
  const { mutate: saveRate, isPending } = useSetManualRateMutation();

  const form = useForm<ManualRateInput>({
    resolver: zodResolver(manualRateSchema),
    defaultValues: {
      currencyCode: 'USD',
      rate: undefined as unknown as number,
      rateDate: undefined,
    },
  });

  const onSubmit = (data: ManualRateInput) => {
    saveRate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="currencyCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moneda</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isPending}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Moneda" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="USD">USD - Dólar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tasa (1 moneda = Bs.)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.000001"
                    min="0"
                    placeholder="Ej: 814.69"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseFloat(e.target.value) : undefined,
                      )
                    }
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rateDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha (opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    value={
                      field.value
                        ? new Date(field.value).toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? new Date(e.target.value) : undefined,
                      )
                    }
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Fijando tasa...' : 'Fijar tasa'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

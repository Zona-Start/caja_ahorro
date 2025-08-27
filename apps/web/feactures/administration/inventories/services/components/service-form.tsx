import { useSystemConfigStore } from '@/store/SystemConfigStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
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
import { useInventoryCategoriesAll } from '../../inventory-categories/hooks';
import { useServiceMutation } from '../hooks/use-mutation-service';
import { SERVICE_STATUS_TYPES } from '../schemas/service-options';
import { Service, serviceSchema } from '../schemas/service.schema';

interface Props {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<Service>;
  readOnly?: boolean;
}

export default function ServiceForm({
  onSuccess,
  onCancel,
  defaultValues,
  readOnly = false,
}: Props) {
  const { mutate: saveService, isPending: isSaving } = useServiceMutation();
  const { data: dataCategory } = useInventoryCategoriesAll('SERVICE');
  const { generalConfig } = useSystemConfigStore();
  const configPurchaseTax = generalConfig.filter(
    (item) => item.key === 'iva_compra',
  );

  const form = useForm<Service>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      ...defaultValues,
      supplierCost: defaultValues?.supplierCost ?? 0,
      otherCosts: defaultValues?.otherCosts ?? 0,
      purchaseTax:
        defaultValues === undefined
          ? Number(configPurchaseTax[0]?.value)
          : defaultValues?.purchaseTax === 0
            ? Number(configPurchaseTax[0]?.value)
            : defaultValues?.purchaseTax,
      categoryId: defaultValues?.categoryId ?? undefined,
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: Service) => {
    saveService(data, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
      onError: () => {
        form.setError('root', {
          type: 'manual',
          message: 'Error al guardar el servicio',
        });
      },
    });
  };

  // Calcular costo calculado automáticamente
  const supplierCost = form.watch('supplierCost');
  const otherCosts = form.watch('otherCosts');
  const purchaseTax = form.watch('purchaseTax');
  const calculatedCost = supplierCost + otherCosts; // Ejemplo de cálculo
  const calculatedCostTixed = calculatedCost * (1 + (purchaseTax ?? 0) / 100); // Ejemplo de cálculo

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {form.formState.errors.root && (
          <div className="text-destructive text-sm">
            {form.formState.errors.root.message}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Categoria</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  defaultValue={String(field.value)}
                  disabled={readOnly}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona una categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="w-full min-w-[200px] max-h-[200px] overflow-y-auto">
                    {dataCategory?.map((item: any) => (
                      <SelectItem
                        key={item.id}
                        value={item.id!.toString()}
                        className={readOnly ? 'bg-muted' : ''}
                      >
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {defaultValues?.id && (
            <FormField
              control={form.control}
              name="serviceCode"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      disabled
                      className={readOnly ? 'bg-muted' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem
                className={`${defaultValues?.id ? 'w-full col-span-2' : 'w-full '}`}
              >
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    disabled={readOnly}
                    className={readOnly ? 'bg-muted' : ''}
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
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value ?? ''}
                    disabled={readOnly}
                    className={readOnly ? 'bg-muted' : ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Costos */}
        <div className="border rounded-lg p-4 space-y-4">
          <h3 className="font-medium text-lg">Costos</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <FormField
              control={form.control}
              name="supplierCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Costo Proveedor</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) =>
                        field.onChange(Number.parseFloat(e.target.value) || 0)
                      }
                      className={readOnly ? 'bg-muted' : ''}
                      readOnly={readOnly}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="otherCosts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Otros Costos</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) =>
                        field.onChange(Number.parseFloat(e.target.value) || 0)
                      }
                      className={readOnly ? 'bg-muted' : ''}
                      readOnly={readOnly}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="purchaseTax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>I.V.A</FormLabel>
                  <FormControl>
                    <div className="flex">
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(Number.parseFloat(e.target.value) || 0)
                        }
                        className={readOnly ? 'bg-muted' : ''}
                        readOnly={readOnly}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <label className="text-sm font-medium">Costo sin Impuesto</label>
              <div className="h-9 px-3 py-2 bg-muted border rounded-md text-sm">
                {calculatedCost.toFixed(2) ?? 0}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Costo con impuesto</label>
              <div className="h-9 px-3 py-2 bg-muted border rounded-md text-sm">
                {calculatedCostTixed.toFixed(2) ?? 0}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {defaultValues?.id && (
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Estatus</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={String(field.value)}
                    disabled={readOnly}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-full min-w-[200px]">
                      {Object.entries(SERVICE_STATUS_TYPES).map(
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
          )}
        </div>

        <div className="sticky bottom-0 w-full bg-background  py-2 px-6 mt-auto">
          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancelar
            </Button>
            {!readOnly && (
              <Button type="submit" disabled={isSaving}>
                {isSaving
                  ? 'Guardando...'
                  : defaultValues?.id
                    ? 'Actualizar'
                    : 'Guardar'}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}

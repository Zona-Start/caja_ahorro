import { useSystemConfigStore } from '@/store/SystemConfigStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import { CustomCalendar } from '@repo/shadcn/components/ui/custom-calendar';
import { ScrollArea } from '@repo/shadcn/components/ui/scroll-area';
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
import { useFixedAssetMutation } from '../hooks/use-mutation-fixed-asset';
import { ESTATUS_TYPES } from '../schemas/fixed-asset-options';
import { FixedAsset, fixedAssetSchema } from '../schemas/fixed-asset.schema';

interface Props {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<FixedAsset>;
  readOnly?: boolean;
}

export default function FixedAssetForm({
  onSuccess,
  onCancel,
  defaultValues,
  readOnly = false,
}: Props) {
  const { mutate: saveFixedAsset, isPending: isSaving } =
    useFixedAssetMutation();

  const { data: dataCategory } = useInventoryCategoriesAll('FIXED_ASSET');
  const { generalConfig } = useSystemConfigStore();
  const configPurchaseTax = generalConfig.filter(
    (item) => item.key === 'iva_compra',
  );

  const form = useForm<FixedAsset>({
    resolver: zodResolver(fixedAssetSchema),
    defaultValues: {
      ...defaultValues,
      categoryId: defaultValues?.categoryId ?? undefined,
      baseCost: defaultValues?.baseCost ?? 0,
      otherCosts: defaultValues?.otherCosts ?? 0,
      purchaseTax:
        defaultValues === undefined
          ? Number(configPurchaseTax[0]?.value)
          : defaultValues?.purchaseTax === 0
            ? Number(configPurchaseTax[0]?.value)
            : defaultValues?.purchaseTax,
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: FixedAsset) => {
    saveFixedAsset(data, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
      onError: () => {
        form.setError('root', {
          type: 'manual',
          message: 'Error al guardar el activo fijo',
        });
      },
    });
  };

  // Calcular costo calculado automáticamente
  const supplierCost = form.watch('baseCost');
  const otherCosts = form.watch('otherCosts');
  const purchaseTax = form.watch('purchaseTax');
  const calculatedCost = supplierCost + otherCosts; // Ejemplo de cálculo
  const calculatedCostTixed = calculatedCost * (1 + (purchaseTax ?? 0) / 100); // Ejemplo de cálculo

  return (
    <Form {...form}>
      <ScrollArea className="h-[calc(100vh-200px)]">
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
                  <FormLabel>Categoría</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    defaultValue={String(field.value)}
                    disabled={readOnly}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona una categoría" />
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

            <FormField
              control={form.control}
              name="assetCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código del Activo</FormLabel>
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
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
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
            <FormField
              control={form.control}
              name="serialNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Serie</FormLabel>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marca</FormLabel>
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
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modelo</FormLabel>
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
            <FormField
              control={form.control}
              name="acquisitionDate"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Fecha Compra</FormLabel>
                  <FormControl>
                    <CustomCalendar
                      value={field.value || null}
                      onChange={field.onChange}
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
              name="usefulLifeYears"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Años de Vida Útil</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
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
          <div
            className={`grid grid-cols-1 ${defaultValues?.id ? 'md:grid-cols-2' : 'md:grid-cols-1'}  gap-4`}
          >
            <FormField
              control={form.control}
              name="depreciationMethod"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Metódo Depreciación</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={String(field.value)}
                    disabled={readOnly}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un frecuencia" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-full min-w-[200px] max-h-[200px] overflow-y-auto">
                      <SelectItem
                        value="Línea recta"
                        className={readOnly ? 'bg-muted' : ''}
                      >
                        Línea recta
                      </SelectItem>
                      <SelectItem
                        value="Suma de los dígitos de los años"
                        className={readOnly ? 'bg-muted' : ''}
                      >
                        Suma de los dígitos de los años
                      </SelectItem>
                      <SelectItem
                        value="Reducción de saldos"
                        className={readOnly ? 'bg-muted' : ''}
                      >
                        Reducción de saldos
                      </SelectItem>
                      <SelectItem
                        value="Unidades de producción"
                        className={readOnly ? 'bg-muted' : ''}
                      >
                        Unidades de producción
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {defaultValues?.id && (
              <FormField
                control={form.control}
                name="assetStatus"
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
                        {Object.entries(ESTATUS_TYPES).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
          {/* Costos */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-lg">Costos</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <FormField
                control={form.control}
                name="baseCost"
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
                            field.onChange(
                              Number.parseFloat(e.target.value) || 0,
                            )
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
                <label className="text-sm font-medium">
                  Costo sin Impuesto
                </label>
                <div className="h-9 px-3 py-2 bg-muted border rounded-md text-sm">
                  {calculatedCost.toFixed(2) ?? 0}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">
                  Costo con impuesto
                </label>
                <div className="h-9 px-3 py-2 bg-muted border rounded-md text-sm">
                  {calculatedCostTixed.toFixed(2) ?? 0}
                </div>
              </div>
            </div>
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
      </ScrollArea>
    </Form>
  );
}

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
import { Textarea } from '@repo/shadcn/textarea';
import { useForm } from 'react-hook-form';
import { useCategoriesQuery } from '../hooks/use-inventory-fixed-assets-queries';
import { useInventoryFixedAssetMutation } from '../hooks/use-inventory-fixed-assets-mutations';
import {
  type InventoryFixedAsset,
  inventoryFixedAssetSchema,
} from '../schemas/inventory-fixed-assets.schema';
import {
  FixedAssetStatus,
  FIXED_ASSET_STATUS_OPTIONS,
  DepreciationMethod,
  DEPRECIATION_METHOD_OPTIONS,
} from '../schemas/inventory-fixed-assets-options';

interface InventoryFixedAssetFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<InventoryFixedAsset>;
  disabled?: boolean;
}

export function InventoryFixedAssetForm({
  onSuccess,
  onCancel,
  defaultValues,
  disabled = false,
}: InventoryFixedAssetFormProps) {
  const { mutate: saveAsset, isPending: isSaving } =
    useInventoryFixedAssetMutation();
  const { data: categories } = useCategoriesQuery();

  const form = useForm<InventoryFixedAsset>({
    resolver: zodResolver(inventoryFixedAssetSchema),
    defaultValues: {
      id: defaultValues?.id,
      name: defaultValues?.name || '',
      description: defaultValues?.description || '',
      categoryId: defaultValues?.categoryId || '',
      assetCode: defaultValues?.assetCode || '',
      serialNumber: defaultValues?.serialNumber || '',
      model: defaultValues?.model || '',
      brand: defaultValues?.brand || '',
      acquisitionDate: defaultValues?.acquisitionDate
        ? new Date(defaultValues.acquisitionDate)
        : new Date(),
      assetStatus:
        defaultValues?.assetStatus || FixedAssetStatus.ACTIVE,
      usefulLifeYears: defaultValues?.usefulLifeYears ?? 0,
      depreciationMethod:
        defaultValues?.depreciationMethod ||
        DepreciationMethod.STRAIGHT_LINE,
      accumulatedDepreciation:
        defaultValues?.accumulatedDepreciation ?? 0,
      baseCost: defaultValues?.baseCost ?? 0,
      otherCosts: defaultValues?.otherCosts ?? 0,
      purchaseTax: defaultValues?.purchaseTax ?? 0,
    },
  });

  const onSubmit = async (data: InventoryFixedAsset) => {
    saveAsset(data, {
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nombre del activo"
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
            name="assetCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código de Activo</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Código único"
                    {...field}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descripción del activo fijo"
                  {...field}
                  value={field.value ?? ''}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría">
                        {categories?.find((c) => c.id === field.value)
                          ?.name ?? 'Seleccionar categoría'}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
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
            name="serialNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Serie</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Número de serie"
                    {...field}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modelo</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Modelo"
                    {...field}
                    value={field.value ?? ''}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marca</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Marca"
                    {...field}
                    value={field.value ?? ''}
                    disabled={disabled}
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
              <FormItem>
                <FormLabel>Fecha de Adquisición</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={
                      field.value instanceof Date
                        ? field.value.toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e) =>
                      field.onChange(new Date(e.target.value))
                    }
                    disabled={disabled}
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
            name="assetStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado del Activo</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(FIXED_ASSET_STATUS_OPTIONS).map(
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

          <FormField
            control={form.control}
            name="depreciationMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Método de Depreciación</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(DEPRECIATION_METHOD_OPTIONS).map(
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FormField
            control={form.control}
            name="baseCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Costo Base</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
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
            name="otherCosts"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Otros Costos</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
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
            name="purchaseTax"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Impuesto de Compra</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
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
            name="usefulLifeYears"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vida Útil (años)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="1"
                    placeholder="0"
                    {...field}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="accumulatedDepreciation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Depreciación Acumulada</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {disabled ? (
          <div className="flex justify-end">
            <Button type="button" onClick={onCancel}>
              Cerrar
            </Button>
          </div>
        ) : (
          <div className="flex justify-end gap-4 pt-4">
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}

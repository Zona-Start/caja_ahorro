import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
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
import { Package } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useCategoriesQuery, useProductDefaults } from '../hooks/use-products-queries';
import { useProductMutation } from '../hooks/use-products-mutations';
import {
  commerceProductFormSchema,
  toCommerceFormValues,
  toCommerceProductPayload,
  type CommerceProductForm as CommerceProductFormValues,
} from '../schemas/commerce-products.schema';
import { UNIT_MEASURES } from '../schemas/products-options';
import type { Product } from '../schemas/products.schema';

interface CommerceProductFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<Product>;
}

export function CommerceProductForm({
  onSuccess,
  onCancel,
  defaultValues,
}: CommerceProductFormProps) {
  const { mutateAsync: saveProduct, isPending } = useProductMutation();
  const { data: categories, isLoading: isLoadingCategories } = useCategoriesQuery();
  const { data: settings } = useProductDefaults();

  const form = useForm<CommerceProductFormValues>({
    resolver: zodResolver(commerceProductFormSchema),
    defaultValues: {
      name: '',
      categoryId: '',
      sku: '',
      description: '',
      unitOfMeasure: 'UNIT',
      supplierCost: 0,
      salePrice: 0,
      stockMin: 0,
      ...toCommerceFormValues(defaultValues),
    },
  });

  useEffect(() => {
    form.reset({
      name: '',
      categoryId: '',
      sku: '',
      description: '',
      unitOfMeasure: 'UNIT',
      supplierCost: 0,
      salePrice: 0,
      stockMin: 0,
      ...toCommerceFormValues(defaultValues),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValues]);

  const onSubmit = (data: CommerceProductFormValues) => {
    const payload = toCommerceProductPayload(data, {
      salesTaxPercent: settings?.taxSales ?? 16,
      purchaseTaxPercent: settings?.taxPurchases ?? 16,
      defaultProfitMargin: settings?.utilityProduct ?? 0,
    });
    saveProduct(
      {
        ...payload,
        ...(defaultValues?.id ? { id: defaultValues.id } : {}),
      } as Product & { _suppliers?: [] },
      {
        onSuccess: () => {
          form.reset();
          onSuccess?.();
        },
      },
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 px-4 pt-4 pb-3">
            <Package className="text-primary h-5 w-5" />
            <CardTitle className="text-base">Datos del Producto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-4 pb-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Harina de maíz 1kg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingCategories ? (
                        <SelectItem value="loading" disabled>
                          Cargando...
                        </SelectItem>
                      ) : (
                        (categories ?? []).map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="supplierCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Costo (opcional)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="salePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio de venta (IVA incl.)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stockMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock mínimo (alerta)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unitOfMeasure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNIT_MEASURES.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  <FormLabel>Descripción (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      className="resize-none"
                      placeholder="Descripción breve"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

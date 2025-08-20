import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/shadcn/table';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useFixedAssetAll } from '../../fixed-asset/hooks/use-query-fixed-asset'; // Asumiendo este hook
import { useProductsAll } from '../../products/hooks/use-query-product';
import { useInventoryMovementMutation } from '../hooks/use-mutation-inventory-movement';
import { MOVEMENT_TYPES } from '../schemas';
import {
  CreateInventoryMovement,
  createInventoryMovementSchema,
} from '../schemas/inventory-movement.schema';

interface Props {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<CreateInventoryMovement>;
  readOnly?: boolean;
}

// Interfaz para manejar el estado local del ítem a agregar
interface NewItemState {
  itemType: 'PRODUCT' | 'FIXED_ASSET' | null;
  itemId: number | null;
  quantity: number;
  unitCost: number | null;
}

export default function InventoryMovementForm({
  onSuccess,
  onCancel,
  defaultValues,
  readOnly = false,
}: Props) {
  const { mutate: saveInventoryMovement, isPending: isSaving } =
    useInventoryMovementMutation();
  const { data: dataProducts } = useProductsAll();
  const { data: dataFixedAssets } = useFixedAssetAll(); // Asumiendo un hook para activos fijos

  const form = useForm<CreateInventoryMovement>({
    resolver: zodResolver(createInventoryMovementSchema),
    defaultValues: {
      ...defaultValues,
      movementType: defaultValues?.movementType ?? MOVEMENT_TYPES.IN,
      items: defaultValues?.items ?? [],
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Estado local para el ítem que se va a agregar
  const [newItem, setNewItem] = useState<NewItemState>({
    itemType: null,
    itemId: null,
    quantity: 0,
    unitCost: null,
  });

  // Función para agregar un ítem a la lista
  const addItemToMovement = () => {
    if (newItem.itemType && newItem.itemId && newItem.quantity > 0) {
      const isProduct = newItem.itemType === 'PRODUCT';
      const itemData = isProduct
        ? dataProducts?.find((p) => p.id === newItem.itemId)
        : dataFixedAssets?.find((fa: any) => fa.id === newItem.itemId);

      if (itemData) {
        // Asumiendo una estructura de datos similar para ambos tipos
        append({
          itemId: itemData.id!,
          itemType: newItem.itemType,
          quantity: newItem.quantity,
          unitCost: newItem.unitCost ?? undefined, // Fixed: Use newItem.unitCost
          // itemName: itemData.name, // Removed: Not part of the schema
        });
        // Limpiar los campos para el siguiente ítem
        setNewItem({
          itemType: null,
          itemId: null,
          quantity: 0,
          unitCost: null,
        });
      }
    }
  };

  // Función para calcular los totales del movimiento
  const calculateMovementTotals = () => {
    const items = form.getValues('items');
    const totalItems = items.length;
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = items.reduce(
      (sum, item) => sum + item.quantity * (item.unitCost || 0),
      0,
    );
    return { totalItems, totalQuantity, totalValue };
  };

  const onSubmit = async (data: CreateInventoryMovement) => {
    saveInventoryMovement(data, {
      onSuccess: () => {
        form.reset({
          movementType: MOVEMENT_TYPES.IN,
          items: [],
        });
        onSuccess?.();
      },
      onError: () => {
        form.setError('root', {
          type: 'manual',
          message: 'Error al guardar el movimiento de inventario',
        });
      },
    });
  };

  const filteredItems =
    newItem.itemType === 'PRODUCT'
      ? dataProducts
      : newItem.itemType === 'FIXED_ASSET'
        ? dataFixedAssets
        : [];

  return (
    <Form {...form}>
      <ScrollArea className="h-[calc(100vh-200px)]">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {form.formState.errors.root && (
            <div className="text-destructive text-sm">
              {form.formState.errors.root.message}
            </div>
          )}

          {/* Sección de Información General */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="movementType"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Tipo de Movimiento</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={String(field.value)}
                    disabled={readOnly}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccione un tipo de movimiento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-full min-w-[200px]">
                      {Object.entries(MOVEMENT_TYPES).map(([key, label]) => (
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
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
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
              name="documentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Documento</FormLabel>
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
              name="documentNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Documento</FormLabel>
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
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

          <hr className="my-4" />

          {/* Sección para agregar ítems */}
          {!readOnly && (
            <Card className="p-4 space-y-4">
              <CardHeader className="p-0">
                <CardTitle>Agregar Ítems al Movimiento</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  {' '}
                  {/* Adjusted grid-cols and added items-end */}
                  {/* Selección de Tipo de Ítem */}
                  <div className="flex flex-col gap-2">
                    {' '}
                    {/* Adjusted spacing */}
                    <FormLabel>Tipo de Ítem</FormLabel>
                    <Select
                      value={newItem.itemType || ''}
                      onValueChange={(value) =>
                        setNewItem({
                          ...newItem,
                          itemType: value as 'PRODUCT' | 'FIXED_ASSET',
                          itemId: null,
                          quantity: 0,
                          unitCost: null,
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        {' '}
                        {/* Adjusted width */}
                        <SelectValue placeholder="Selecciona tipo de ítem" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRODUCT">PRODUCTO</SelectItem>
                        <SelectItem value="FIXED_ASSET">ACTIVO FIJO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Selección de Ítem Específico */}
                  <div className="flex flex-col gap-2">
                    {' '}
                    {/* Adjusted spacing */}
                    <FormLabel>Ítem</FormLabel>
                    <Select
                      value={newItem.itemId?.toString() || ''}
                      onValueChange={(value) =>
                        setNewItem({ ...newItem, itemId: Number(value) })
                      }
                      disabled={!newItem.itemType}
                    >
                      <SelectTrigger className="w-full">
                        {' '}
                        {/* Adjusted width */}
                        <SelectValue placeholder="Seleccionar ítem" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px] overflow-y-auto">
                        {filteredItems?.map((item: any) => (
                          <SelectItem key={item.id} value={item.id.toString()}>
                            {item.code} - {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Cantidad */}
                  <div className="flex flex-col gap-2">
                    {' '}
                    {/* Adjusted spacing */}
                    <FormLabel>Cantidad</FormLabel>
                    <Input
                      type="number"
                      value={newItem.quantity}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          quantity: Number(e.target.value),
                        })
                      }
                      min="0"
                      step="1"
                      disabled={!newItem.itemId}
                      className="w-full"
                    />
                  </div>
                  {/* Costo Unitario */}
                  <div className="flex flex-col gap-2">
                    {' '}
                    {/* Adjusted spacing */}
                    <FormLabel>Costo Unitario</FormLabel>
                    <Input
                      type="number"
                      value={newItem.unitCost ?? ''}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          unitCost: Number(e.target.value),
                        })
                      }
                      placeholder="Costo por defecto"
                      min="0"
                      step="0.01"
                      disabled={!newItem.itemId}
                      className="w-full"
                    />
                  </div>
                  {/* Botón para agregar */}
                  <div className="flex items-end">
                    {' '}
                    {/* Adjusted spacing */}
                    <Button
                      onClick={addItemToMovement}
                      type="button"
                      className="w-full"
                      disabled={!newItem.itemId || newItem.quantity <= 0}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Agregar Ítem
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <hr className="my-4" />

          {/* Lista de ítems agregados */}
          {fields.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium text-lg">Ítems en el Movimiento</h4>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Costo Unit.</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => {
                      const itemData =
                        field.itemType === 'PRODUCT'
                          ? dataProducts?.find((p) => p.id === field.itemId)
                          : dataFixedAssets?.find(
                              (fa: any) => fa.id === field.itemId,
                            );

                      return (
                        <TableRow key={field.id}>
                          <TableCell>{field.itemType}</TableCell>
                          <TableCell>{itemData?.name}</TableCell>
                          <TableCell>{field.quantity}</TableCell>
                          <TableCell>
                            Bs.{(field.unitCost ?? 0).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            Bs.
                            {(field.quantity * (field.unitCost ?? 0)).toFixed(
                              2,
                            )}
                          </TableCell>
                          {!readOnly && (
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Resumen del movimiento */}
              <div className="p-4 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Ítems:</span>{' '}
                    {calculateMovementTotals().totalItems}
                  </div>
                  <div>
                    <span className="font-medium">Total Cantidad:</span>{' '}
                    {calculateMovementTotals().totalQuantity}
                  </div>
                  <div>
                    <span className="font-medium">Valor Total:</span> Bs.{' '}
                    {calculateMovementTotals().totalValue.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="sticky bottom-0 w-full bg-background py-2 px-6 mt-auto">
            <div className="flex justify-end gap-4">
              <Button variant="outline" type="button" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </form>
      </ScrollArea>
    </Form>
  );
}

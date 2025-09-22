'use client';
import { IconWrapper } from '@/components/icon-wrapper';
import { useSupplierAll } from '@/feactures/administration/suppliers/hooks/use-query-suppliers';
import { useCategoriesTypesGroup } from '@/feactures/common/category-types/hooks/use-querys-category-types';
import { useProducts } from '@/feactures/savings-banks/credits/credits-management/hooks/use-query-products';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/card';
import { Badge } from '@repo/shadcn/components/ui/badge';
import { CustomCalendar } from '@repo/shadcn/components/ui/custom-calendar';
import { SelectSearchable } from '@repo/shadcn/components/ui/select-searchable';
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
import { Banknote, Check, PlusCircle, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import * as z from 'zod';
import { useQueryWithdrawalType } from '../hooks/use-query-withdrawal';
import { PAYMENT_METHOD } from '../schemas/withdrawal-options';
import { withdrawalSchema } from '../schemas/withdrawal.schema';
import { useWithdrawalStore } from '../store/withdrawalStore';

interface WithdrawalProps {
  isSubmitting: boolean;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  currentCurrencyCode: string | undefined;
  currentExchangeRate: number | undefined;
  initialData?: any;
  isEdit?: boolean;
}

const COMMERCIAL_HOUSE_NONE = 'none';

export function WithdrawalForm({
  isSubmitting,
  onSubmit,
  onCancel,
  currentCurrencyCode,
  currentExchangeRate,
  initialData,
  isEdit,
}: WithdrawalProps) {
  const {
    selectedAssociate,
    withdrawalSummary,
    selectedWithdrawlType,
    setselectedWithdrawlType,
    setWithdrawalSummary,
    enabledTime,
  } = useWithdrawalStore();

  const [exceedingAvailability, setExceedingAvailability] = useState(false);
  const { data: withdrawlTypes } = useQueryWithdrawalType();
  const { data: productsData } = useProducts();
  const { data: suppliers } = useSupplierAll();
  const { data: daysType } = useCategoriesTypesGroup('DAYS_TYPE');
  const availableProducts = productsData?.data || [];

  const form = useForm<z.infer<typeof withdrawalSchema>>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      id: 0,
      associateAccountId: 0,
      withdrawalDate: new Date(),
      withdrawalTypeId: 0,
      requestedAmount: '0.00',
      paymentMethod: 'BANK_TRANSFER',
      commercialHouseId: COMMERCIAL_HOUSE_NONE,
      products: [],
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'products',
  });

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  useEffect(() => {
    if (selectedAssociate) {
      form.setValue('associateAccountId', selectedAssociate.associateAccountId);
    } else {
      form.setValue('id', 0);
    }
  }, [selectedAssociate, form]);

  const withdrawalTypeId = useWatch({
    control: form.control,
    name: 'withdrawalTypeId',
  });

  const commercialHouseId = useWatch({
    control: form.control,
    name: 'commercialHouseId',
  });

  const requestedAmount = Number.parseFloat(
    form.watch('requestedAmount') || '0',
  );

  const watchedProducts = useWatch({ control: form.control, name: 'products' });
  const watchedItems = useWatch({ control: form.control, name: 'items' });
  const selectedWithdrawalType = withdrawlTypes?.data?.find(
    (lt) => lt.id === Number(withdrawalTypeId),
  );

  const showProductSelection = selectedWithdrawalType?.isInternalInventory;
  const showCommercialHouseDropdown = selectedWithdrawalType?.isHouseComercial;

  const showCommercialItems =
    showCommercialHouseDropdown &&
    commercialHouseId &&
    commercialHouseId !== COMMERCIAL_HOUSE_NONE;

  const commercialItemsInvalid = useMemo(() => {
    if (!showCommercialItems) {
      return false;
    }
    if (watchedItems && watchedItems.length > 0) {
      return watchedItems.some(
        (item) =>
          !item.description || item.description.trim() === '' || !item.days,
      );
    }
    return false;
  }, [showCommercialItems, watchedItems]);

  const balance = Number(selectedAssociate?.balance);
  const availability = balance * 0.8;

  useEffect(() => {
    if (!selectedAssociate) return;
    if (withdrawalTypeId) {
      const withdrawlType = withdrawlTypes?.data?.find(
        (lt) => lt.id === Number(withdrawalTypeId),
      );
      setselectedWithdrawlType(withdrawlType ?? null);
    } else {
      setselectedWithdrawlType(null);
    }
  }, [
    withdrawalTypeId,
    withdrawlTypes,
    setselectedWithdrawlType,
    selectedAssociate,
  ]);

  useEffect(() => {
    if (!showProductSelection) return;
    const totalCost = (watchedProducts || []).reduce((acc, p) => {
      const quantity = Number(p?.quantity) || 0;
      if (p?.productId && quantity > 0) {
        const productDetails = availableProducts.find(
          (prod) => prod.id === Number(p.productId),
        );
        if (productDetails) {
          return acc + Number(productDetails.productPrice) * quantity;
        }
      }
      return acc;
    }, 0);
    const rounded = totalCost.toFixed(2);
    if (form.getValues('requestedAmount') !== rounded) {
      form.setValue('requestedAmount', rounded, { shouldValidate: true });
    }
  }, [watchedProducts, showProductSelection, availableProducts, form]);

  useEffect(() => {
    if (!showCommercialItems) return;
    const totalCost = (watchedItems || []).reduce((acc, item) => {
      const quantity = Number(item?.quantity) || 0;
      const cost = Number(item?.cost) || 0;
      return acc + quantity * cost;
    }, 0);
    const rounded = totalCost.toFixed(2);
    if (form.getValues('requestedAmount') !== rounded) {
      form.setValue('requestedAmount', rounded, { shouldValidate: true });
    }
  }, [watchedItems, showCommercialItems, form]);

  useEffect(() => {
    if (!selectedAssociate) return;
    if (requestedAmount) {
      const expenses = Number.parseFloat(
        selectedWithdrawlType?.administrativeFeePercentage ?? '0',
      );
      const totalAdministrativeExpenses = (requestedAmount * expenses) / 100;
      const totalPayable = requestedAmount - totalAdministrativeExpenses;

      if (requestedAmount > availability) {
        setExceedingAvailability(true);
        setWithdrawalSummary(null);
      } else {
        setExceedingAvailability(false);
        setWithdrawalSummary({
          totalWithdrawal: requestedAmount.toFixed(2),
          totalPayable: totalPayable.toFixed(2),
          installmentAmount: totalAdministrativeExpenses.toFixed(2),
        });
      }
    } else if (requestedAmount === 0) {
      setWithdrawalSummary(null);
      setExceedingAvailability(false);
    }
  }, [
    requestedAmount,
    selectedAssociate,
    selectedWithdrawlType,
    availability,
    setWithdrawalSummary,
  ]);

  const handleSubmit = form.handleSubmit((data) => {
    let withdrawalItems: any[] = [];
    if (showProductSelection) {
      withdrawalItems = (data.products || []).map((p: any) => {
        const productDetails = availableProducts.find(
          (prod) => prod.id === Number(p.productId),
        );
        return {
          itemType: 'PRODUCT',
          itemDescription: null,
          itemId: Number(p.productId),
          quantity: p.quantity,
          agreedSellingPrice: productDetails
            ? Number(productDetails.productPrice)
            : 0,
          days: null,
        };
      });
    } else if (showCommercialItems) {
      withdrawalItems = (data.items || []).map((item: any) => {
        const day = daysType?.data?.find((d) => d.id === Number(item.days));
        return {
          itemType: 'EXTERNAL',
          itemDescription: item.description,
          itemId: null,
          quantity: item.quantity,
          agreedSellingPrice: item.cost,
          days: day?.description || null,
        };
      });
    }

    const dataToSubmit = {
      ...data,
      withdrawalItems,
      commercialHouseId: showCommercialHouseDropdown ? commercialHouseId : null,
    };

    delete dataToSubmit.products;
    delete dataToSubmit.items;

    onSubmit(dataToSubmit);
  });

  const handleCancel = () => {
    form.reset();
    onCancel();
  };

  const hasBlocks =
    selectedAssociate?.totalLoansAssociate !== 0
      ? true
      : selectedAssociate?.totalCreditsAssociate !== 0
        ? true
        : selectedAssociate?.isPayrollCredit
          ? true
          : false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconWrapper className="w-8 h-8">
            <Banknote />
          </IconWrapper>
          Datos del Retiro
        </CardTitle>
        <CardDescription>
          Ingrese la información del retiro a registrar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField
              control={form.control}
              name="withdrawalTypeId"
              render={({ field }) => (
                <FormItem className="w-full col-span-2">
                  <FormLabel>Tipo de Retiro</FormLabel>
                  <SelectSearchable
                    options={
                      withdrawlTypes?.data?.map((item: any) => ({
                        value: item.id!.toString(),
                        label: `${item.description}`,
                      })) || []
                    }
                    onValueChange={(value) => field.onChange(Number(value))}
                    placeholder="Selecciona un tipo"
                    defaultValue={String(field.value)}
                    disabled={
                      !selectedAssociate ||
                      isSubmitting ||
                      !enabledTime ||
                      hasBlocks
                    }
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {showCommercialHouseDropdown && (
              <FormField
                control={form.control}
                name="commercialHouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Casa Comercial</FormLabel>
                    <SelectSearchable
                      placeholder="Filtrar por proveedor"
                      options={
                        suppliers?.map((supplier) => ({
                          value: supplier.id!.toString(),
                          label: supplier.name,
                        })) || []
                      }
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue('items', []);
                        form.setValue('requestedAmount', '');
                      }}
                      defaultValue={field.value ?? undefined}
                      disabled={!selectedAssociate || isSubmitting || hasBlocks}
                      enableNoneOption
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {showProductSelection && (
              <Card>
                <CardHeader>
                  <CardTitle>Selección de Productos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({ productId: '', quantity: 1 })}
                    disabled={!selectedAssociate || isSubmitting || hasBlocks}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Anexar Producto
                  </Button>
                  {fields.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead className="text-right">Precio</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fields.map((field, index) => {
                          const product = availableProducts.find(
                            (p) =>
                              p.id ===
                              Number(form.watch(`products.${index}.productId`)),
                          );
                          const quantity =
                            form.watch(`products.${index}.quantity`) || 0;
                          const subtotal =
                            Number(product?.productPrice || 0) * quantity;
                          return (
                            <TableRow key={field.id}>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`products.${index}.productId`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Seleccione..." />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {availableProducts.map((p) => (
                                            <SelectItem
                                              key={p.id}
                                              value={String(p.id)}
                                            >
                                              {p.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`products.${index}.quantity`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <Input
                                        type="number"
                                        min="1"
                                        {...field}
                                        onChange={(e) =>
                                          field.onChange(e.target.valueAsNumber)
                                        }
                                      />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                {Number(product?.productPrice || 0).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right">
                                {subtotal.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => remove(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            {showCommercialItems && (
              <Card>
                <CardHeader>
                  <CardTitle>Items de Casa Comercial</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      appendItem({
                        description: '',
                        quantity: 1,
                        cost: 0,
                        days: '',
                      })
                    }
                    disabled={!selectedAssociate || isSubmitting || hasBlocks}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Agregar Item
                  </Button>
                  {itemFields.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Jornada</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead className="text-right">Costo</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {itemFields.map((field, index) => {
                          const quantity =
                            form.watch(`items.${index}.quantity`) || 0;
                          const cost = form.watch(`items.${index}.cost`) || 0;
                          const subtotal = quantity * cost;
                          return (
                            <TableRow key={field.id}>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.description`}
                                  render={({ field }) => <Input {...field} />}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.days`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Selecciona una jornada" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {daysType?.data?.map((item: any) => (
                                            <SelectItem
                                              key={item.id}
                                              value={item.id!.toString()}
                                            >
                                              {item.description}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.quantity`}
                                  render={({ field }) => (
                                    <Input
                                      type="number"
                                      min="1"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(e.target.valueAsNumber)
                                      }
                                    />
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.cost`}
                                  render={({ field }) => (
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(e.target.valueAsNumber)
                                      }
                                    />
                                  )}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                {subtotal.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeItem(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="requestedAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto del Retiro</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                          {currentCurrencyCode === 'VES' ? 'Bs ' : '$ '}
                        </span>
                        <Input
                          className="pl-8"
                          placeholder="0.00"
                          {...field}
                          value={
                            field.value && !isNaN(field.value as any)
                              ? field.value
                              : ''
                          }
                          disabled={
                            !!(
                              !selectedAssociate ||
                              isSubmitting ||
                              !enabledTime ||
                              hasBlocks ||
                              showProductSelection ||
                              showCommercialItems
                            )
                          }
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="withdrawalDate"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Fecha de Retiro</FormLabel>
                    <FormControl>
                      <CustomCalendar
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Seleccione la fecha"
                        disabled={
                          !selectedAssociate ||
                          isSubmitting ||
                          !enabledTime ||
                          hasBlocks
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Retiro</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={
                        !selectedAssociate ||
                        isSubmitting ||
                        !enabledTime ||
                        hasBlocks
                      }
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccione el tipo" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        {Object.entries(PAYMENT_METHOD).map(
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

            {withdrawalSummary && (
              <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Resumen del Retiro
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Monto Solicitado
                      </p>
                      <p className="text-lg font-medium">
                        {currentCurrencyCode === 'VES' ? 'Bs ' : '$ '}{' '}
                        {withdrawalSummary.totalWithdrawal}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Gastos Administrativos
                      </p>
                      <p className="text-lg font-medium">
                        {currentCurrencyCode === 'VES' ? 'Bs ' : '$ '}{' '}
                        {withdrawalSummary.installmentAmount}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total a Transferir
                      </p>
                      <p className="text-lg font-medium">
                        {currentCurrencyCode === 'VES' ? 'Bs ' : '$ '}{' '}
                        {withdrawalSummary.totalPayable}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {exceedingAvailability && (
              <div className="flex items-center justify-center mt-4">
                <Badge
                  className={`text-white text-lg bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700`}
                >
                  El monto solicitado excede la disponibilidad
                </Badge>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => handleCancel()}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  !selectedAssociate ||
                  isSubmitting ||
                  !form.formState.isValid ||
                  exceedingAvailability ||
                  hasBlocks ||
                  requestedAmount <= 0 ||
                  commercialItemsInvalid
                }
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-1">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                    Procesando...
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Check className="h-4 w-4" />
                    {isEdit ? 'Actualizar Retiro' : 'Crear Retiro'}
                  </span>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

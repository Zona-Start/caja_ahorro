'use client';
import { IconWrapper } from '@/components/icon-wrapper';
import { useSupplierAll } from '@/feactures/administration/suppliers/hooks/use-query-suppliers';
import { useCategoriesTypesGroup } from '@/feactures/common/category-types/hooks/use-querys-category-types';
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
import { Textarea } from '@repo/shadcn/textarea';
import {
  CalendarDays,
  Check,
  CreditCard,
  PlusCircle,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import * as z from 'zod';
import { useTypeCredits } from '../../type-credits/hooks/use-query-type-credits';
import { useProducts } from '../hooks/use-query-products';
import { CREDIT_MODALITY } from '../schemas/credits-management-options';
import { creditManagementSchema } from '../schemas/credits-management.schema';
import { AssociatesLoan } from '../schemas/individual-credit-api-schema'; // Ensure this import exists

interface CreditFormProps {
  selectedAssociate: AssociatesLoan | null;
  isSubmitting: boolean;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loanSummary: any | null;
  onFormChange: (values: any) => void;
  currentCurrencyCode: string | undefined;
  currentExchangeRate: number | undefined;
  endDate?: string | Date;
  initialData?: any;
  isEdit?: boolean;
}

const COMMERCIAL_HOUSE_NONE = 'none';
const COMMERCIAL_HOUSE_INTERNAL = 'internal_inventory';

export function CreditForm({
  selectedAssociate,
  isSubmitting,
  onSubmit,
  onCancel,
  loanSummary,
  onFormChange,
  currentCurrencyCode,
  currentExchangeRate,
  endDate,
  initialData,
  isEdit,
}: CreditFormProps) {
  const form = useForm<z.infer<typeof creditManagementSchema>>({
    resolver: zodResolver(creditManagementSchema),
    defaultValues:
      isEdit && initialData
        ? {
            id: initialData?.id,
            associateId: initialData?.associateId,
            creditTypeId: initialData?.creditTypeId,
            creditModality: initialData?.creditModality,
            requestDate: initialData.requestDate
              ? new Date(initialData.requestDate)
              : new Date(),
            requestedAmount: initialData?.requestedAmount,
            startDate: initialData?.startDate
              ? new Date(initialData.startDate)
              : new Date(),
            endDate: initialData?.endDate,
            termMonths: initialData?.termMonths,
            status: initialData?.status,
            interestRate: initialData?.interestRate,
            installmentsCount: initialData?.termMonths,
            expensesAmount: initialData?.expensesAmount,
            overdraftAmount: initialData?.overdraftAmount,
            notes: initialData?.notes ?? '',
            commercialHouseId: initialData?.commercialHouseId,
            invoiceNumber: initialData?.invoiceNumber,
            products: initialData?.products || [],
            items: initialData?.items || [],
            useCommercialHouse: initialData?.useCommercialHouse || false,
          }
        : {
            id: '0',
            creditTypeId: '',
            creditModality: '',
            requestDate: new Date(),
            requestedAmount: '',
            startDate: new Date(),
            endDate: '',
            termMonths: '',
            status: 'REQUESTED',
            interestRate: '',
            installmentsCount: '',
            expensesAmount: '',
            overdraftAmount: null,
            notes: '',
            commercialHouseId: COMMERCIAL_HOUSE_NONE,
            invoiceNumber: '',
            products: [],
            items: [],
            useCommercialHouse: false,
          },
  });

  const { setValue, reset, watch, getValues, control } = form;

  const [exceedingAvailability, setExceedingAvailability] = useState(false);

  const { data: productsData } = useProducts();

  const { data: suppliers } = useSupplierAll();
  const { data: daysType } = useCategoriesTypesGroup('DAYS_TYPE');
  const { data: creditTypes } = useTypeCredits();
  const availableProducts = productsData?.data || [];

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'products',
  });

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control,
    name: 'items',
  });

  const commercialHouseId = watch('commercialHouseId');

  const showInternalInventory = commercialHouseId === COMMERCIAL_HOUSE_INTERNAL;
  const showCommercialItems =
    commercialHouseId &&
    commercialHouseId !== COMMERCIAL_HOUSE_NONE &&
    commercialHouseId !== COMMERCIAL_HOUSE_INTERNAL;

  const requestedAmountValue = watch('requestedAmount');
  const creditTypeId = watch('creditTypeId');
  const startDateValue = watch('startDate');
  const termMonthsValue = watch('termMonths');
  const watchedProducts = useWatch({ control, name: 'products' });
  const watchedItems = useWatch({ control, name: 'items' });

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) {
      return '';
    }
    if (currentCurrencyCode === 'USD' && currentExchangeRate) {
      return `${(amount / currentExchangeRate).toFixed(2)}`;
    }
    if (currentCurrencyCode === 'VES') {
      return `Bs. ${amount.toFixed(2)}`;
    }
    return `${amount.toFixed(2)}`;
  };

  useEffect(() => {
    if (!showInternalInventory) return;

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
    if (getValues('requestedAmount') !== rounded) {
      setValue('requestedAmount', rounded, { shouldValidate: true });
      onFormChange({ ...getValues(), requestedAmount: rounded });
    }
  }, [
    watchedProducts,
    showInternalInventory,
    availableProducts,
    getValues,
    setValue,
    onFormChange,
  ]);

  useEffect(() => {
    if (!showCommercialItems) return;

    const totalCost = (watchedItems || []).reduce((acc, item) => {
      const quantity = Number(item?.quantity) || 0;
      const cost = Number(item?.cost) || 0;
      return acc + quantity * cost;
    }, 0);

    const rounded = totalCost.toFixed(2);
    if (getValues('requestedAmount') !== rounded) {
      setValue('requestedAmount', rounded, { shouldValidate: true });
      onFormChange({ ...getValues(), requestedAmount: rounded });
    }
  }, [watchedItems, showCommercialItems, getValues, setValue, onFormChange]);

  useEffect(() => {
    if (isEdit && initialData) {
      reset(initialData);
    }
  }, [isEdit, initialData, reset]);

  const isAssociateBlocked =
    selectedAssociate !== null &&
    (selectedAssociate.totalCredits > 0 ||
      selectedAssociate.totalLoans > 0 ||
      selectedAssociate.associate.isPayrollCredit === true);

  useEffect(() => {
    if (selectedAssociate) {
      setValue('associateId', selectedAssociate.associate.id);
    } else {
      setValue('associateId', 0);
      reset({
        id: '0',
        creditTypeId: '',
        creditModality: '',
        requestDate: new Date(),
        requestedAmount: '',
        startDate: new Date(),
        endDate: '',
        termMonths: '',
        status: 'REQUESTED',
        interestRate: '',
        installmentsCount: '',
        expensesAmount: '',
        overdraftAmount: null,
        notes: '',
        commercialHouseId: COMMERCIAL_HOUSE_NONE,
        invoiceNumber: '',
        products: [],
        items: [],
        useCommercialHouse: false,
      });
    }
  }, [selectedAssociate, setValue, reset]);

  useEffect(() => {
    if (creditTypeId) {
      const creditType = creditTypes?.data?.find(
        (lt) => lt.id === Number(creditTypeId),
      );
      if (creditType) {
        setValue('interestRate', parseInt(creditType.interestRate).toString());
        setValue('termMonths', String(Math.floor(creditType.termUnits)));
        setValue('installmentsCount', creditType.termUnits.toString());
        setValue(
          'expensesAmount',
          parseInt(
            creditType?.administrativeExpensePercentage ?? '0',
          ).toString(),
        );
      }
    }
  }, [creditTypeId, creditTypes, setValue]);

  useEffect(() => {
    if (startDateValue && termMonthsValue) {
      const start = new Date(startDateValue as string | Date);
      const monthsToAdd = parseInt(termMonthsValue as string);
      if (!isNaN(start.getTime()) && !isNaN(monthsToAdd)) {
        const newDate = new Date(start);
        newDate.setMonth(newDate.getMonth() + monthsToAdd);
        const calculatedEndDate = newDate.toISOString().split('T')[0];
        if (getValues('endDate') !== calculatedEndDate) {
          setValue('endDate', calculatedEndDate, { shouldDirty: true });
        }
      }
    }
  }, [startDateValue, termMonthsValue, setValue, getValues]);

  useEffect(() => {
    const subscription = watch((value) => onFormChange(value));
    return () => subscription.unsubscribe();
  }, [watch, onFormChange]);

  const handleSubmit = form.handleSubmit((data) => {
    const saleDate = new Date().toISOString();
    let creditItems: any[] = [];

    if (showInternalInventory) {
      creditItems = (data.products || []).map((p: any) => {
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
          saleDate,
        };
      });
    } else if (showCommercialItems) {
      creditItems = (data.items || []).map((item: any) => ({
        itemType: 'EXTERNAL',
        itemDescription: item.description,
        itemId: null,
        quantity: item.quantity,
        agreedSellingPrice: item.cost,
        saleDate,
        days: Number(item.days),
      }));
    }

    const dataToSubmit = {
      ...data,
      creditItems,
      useCommercialHouse: showInternalInventory,
      commercialHouseId:
        commercialHouseId === COMMERCIAL_HOUSE_NONE ||
        commercialHouseId === COMMERCIAL_HOUSE_INTERNAL
          ? null
          : commercialHouseId,
    };
    onSubmit(dataToSubmit);

    delete dataToSubmit.products;
    delete dataToSubmit.items;
  });

  const handleCancel = () => {
    form.reset();
    onCancel();
  };

  useEffect(() => {
    if (!selectedAssociate) return;
    const requestedAmount = Number.parseFloat(requestedAmountValue || '0');
    if (requestedAmount) {
      const balance = Number(selectedAssociate?.associate.balance);
      const availability = balance * 0.8;
      if (requestedAmount > availability) {
        setExceedingAvailability(true);
      } else {
        setExceedingAvailability(false);
      }
    } else if (requestedAmount === 0) {
      setExceedingAvailability(false);
    }
  }, [requestedAmountValue, selectedAssociate]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconWrapper className="w-8 h-8">
            <CreditCard />
          </IconWrapper>
          Datos del Crédito
        </CardTitle>
        <CardDescription>
          Ingrese la información del crédito a otorgar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={control}
                name="creditTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Crédito</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={
                        !selectedAssociate || isSubmitting || isAssociateBlocked
                      }
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccione el tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {creditTypes?.data?.map((type) => (
                          <SelectItem key={type.id} value={String(type.id)}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="creditModality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modalidad</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={
                        !selectedAssociate || isSubmitting || isAssociateBlocked
                      }
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccione el tipo" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        {Object.entries(CREDIT_MODALITY).map(
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

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={control}
                name="requestDate"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Fecha Solicitud</FormLabel>
                    <FormControl>
                      <CustomCalendar
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Seleccione la fecha"
                        disabled={
                          !selectedAssociate ||
                          isSubmitting ||
                          isAssociateBlocked
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha inicio</FormLabel>
                    <FormControl>
                      <CustomCalendar
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Seleccione la fecha"
                        disabled={
                          !selectedAssociate ||
                          isSubmitting ||
                          isAssociateBlocked
                        }
                        minDate={new Date()}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Culminación</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <CalendarDays className="absolute right-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input type="text" {...field} disabled />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* <FormField
                control={control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estatus</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={
                        !selectedAssociate || isSubmitting || isAssociateBlocked
                      }
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccione el tipo" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        {Object.entries(ESTATUS_TYPES)
                          .filter(([value]) =>
                            ['REQUESTED', 'APPROVED'].includes(value),
                          )
                          .map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}
            </div>

            <FormField
              control={control}
              name="commercialHouseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Casa Comercial</FormLabel>
                  <SelectSearchable
                    placeholder="Filtrar por proveedor"
                    options={[
                      {
                        value: COMMERCIAL_HOUSE_INTERNAL,
                        label: 'Inventario Interno',
                      },
                      ...(suppliers?.map((supplier) => ({
                        value: supplier.id!.toString(),
                        label: supplier.name,
                      })) || []),
                    ]}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setValue('products', []);
                      setValue('items', []);
                      setValue('requestedAmount', '');
                    }}
                    defaultValue={field.value ?? undefined}
                    disabled={
                      !selectedAssociate || isSubmitting || isAssociateBlocked
                    }
                    enableNoneOption
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {showInternalInventory && (
              <Card>
                <CardHeader>
                  <CardTitle>Selección de Productos</CardTitle>
                  <CardDescription>
                    Añada productos del inventario. El monto del crédito se
                    calculará automáticamente.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({ productId: '', quantity: 0 })}
                    disabled={
                      !selectedAssociate || isSubmitting || isAssociateBlocked
                    }
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Anexar Producto
                  </Button>

                  {fields.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40%]">Producto</TableHead>
                          <TableHead className="w-[100px]">Cantidad</TableHead>
                          <TableHead className="text-right">
                            Precio Unit.
                          </TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fields.map((field, index) => {
                          const selectedProductId = watch(
                            `products.${index}.productId`,
                          );
                          const productDetails = availableProducts.find(
                            (p) => p.id === Number(selectedProductId),
                          );
                          const quantity =
                            watch(`products.${index}.quantity`) || 0;
                          const subtotal = productDetails
                            ? Number(productDetails.productPrice) * quantity
                            : 0;
                          const selectedProductIdsInForm =
                            watch('products')?.map((p) => p.productId) || [];

                          return (
                            <TableRow key={field.id}>
                              <TableCell>
                                <FormField
                                  control={control}
                                  name={`products.${index}.productId`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <Select
                                        onValueChange={field.onChange} // ← RHF ya sabe qué hacer
                                        value={field.value}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Seleccione..." />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {availableProducts.map((p) => {
                                            const isSelected =
                                              selectedProductIdsInForm.includes(
                                                String(p.id),
                                              ) && String(p.id) !== field.value;
                                            return (
                                              <SelectItem
                                                key={p.id}
                                                value={String(p.id)}
                                                disabled={isSelected}
                                              >
                                                {p.name}
                                              </SelectItem>
                                            );
                                          })}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={control}
                                  name={`products.${index}.quantity`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <Input
                                        type="number"
                                        min="1"
                                        {...field} // ← importante: spread completo
                                        onChange={(e) =>
                                          field.onChange(e.target.valueAsNumber)
                                        } // ← convierte a número
                                      />
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(
                                  productDetails
                                    ? Number(productDetails.productPrice)
                                    : 0,
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(subtotal)}
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
                  <CardDescription>
                    Añada los items. El monto del crédito se calculará
                    automáticamente.
                  </CardDescription>
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
                    disabled={
                      !selectedAssociate || isSubmitting || isAssociateBlocked
                    }
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Agregar Item
                  </Button>

                  {itemFields.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[30%]">Descripción</TableHead>
                          <TableHead className="w-[25%]">Jornada</TableHead>
                          <TableHead className="w-[100px]">Cantidad</TableHead>
                          <TableHead className="text-right">
                            Costo Unit.
                          </TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {itemFields.map((field, index) => {
                          const quantity =
                            watch(`items.${index}.quantity`) || 0;
                          const cost = watch(`items.${index}.cost`) || 0;
                          const subtotal = quantity * cost;

                          return (
                            <TableRow key={field.id}>
                              <TableCell>
                                <FormField
                                  control={control}
                                  name={`items.${index}.description`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <Input type="text" {...field} />
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={control}
                                  name={`items.${index}.days`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                      >
                                        <FormControl>
                                          <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Selecciona una jornada" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="w-full min-w-[200px] max-h-[200px] overflow-y-auto">
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

                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={control}
                                  name={`items.${index}.quantity`}
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
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={control}
                                  name={`items.${index}.cost`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        {...field}
                                        onChange={(e) =>
                                          field.onChange(e.target.valueAsNumber)
                                        }
                                      />
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(subtotal)}
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

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <FormField
                control={control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nro Factura</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          disabled={
                            !selectedAssociate ||
                            isSubmitting ||
                            isAssociateBlocked
                          }
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="requestedAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto del Crédito</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                          {currentCurrencyCode === 'VES' ? 'Bs ' : '$ '}
                        </span>
                        <Input
                          className="pl-8"
                          placeholder="0.00"
                          {...field}
                          value={field.value ?? ''}
                          disabled={
                            !selectedAssociate ||
                            isSubmitting ||
                            isAssociateBlocked ||
                            !!showInternalInventory ||
                            !!showCommercialItems
                          }
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="overdraftAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto de Sobregiro (si aplica)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                          $
                        </span>
                        <Input
                          className="pl-7"
                          placeholder="0.00"
                          {...field}
                          value={field.value ?? ''}
                          disabled={
                            !selectedAssociate ||
                            isSubmitting ||
                            isAssociateBlocked
                          }
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl>
                    <Textarea
                      defaultValue={field.value ?? ''}
                      placeholder="Ingrese cualquier observación relevante sobre el crédito"
                      className="resize-none"
                      disabled={
                        !selectedAssociate || isSubmitting || isAssociateBlocked
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {loanSummary && !exceedingAvailability && (
              <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Resumen del Crédito
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Cuota Mensual
                      </p>
                      <p className="text-lg font-medium">
                        {currentCurrencyCode === 'VES' ? 'Bs ' : '$ '}{' '}
                        {loanSummary.totalQuota}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Interés Total
                      </p>
                      <p className="text-lg font-medium">
                        {currentCurrencyCode === 'VES' ? 'Bs ' : '$ '}{' '}
                        {loanSummary.totalInterest}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Gastos Administrativos
                      </p>
                      <p className="text-lg font-medium">
                        {currentCurrencyCode === 'VES' ? 'Bs ' : '$ '}{' '}
                        {loanSummary.installmentAmount}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Crédito a Pagar
                      </p>
                      <p className="text-lg font-medium">
                        {currentCurrencyCode === 'VES' ? 'Bs ' : '$ '}{' '}
                        {loanSummary.totalPayable}
                      </p>
                    </div>
                    {/* <div>
                      <p className="text-sm text-muted-foreground">
                        Total Crédito Disponible
                      </p>
                      <p className="text-lg font-medium">
                        {currentCurrencyCode === 'VES' ? 'Bs ' : '$ '}{' '}
                        {loanSummary.totalAvailable}
                      </p>
                    </div> */}
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
                  isAssociateBlocked ||
                  exceedingAvailability
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
                    {isEdit ? 'Actualizar Crédito' : 'Crear Crédito'}
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

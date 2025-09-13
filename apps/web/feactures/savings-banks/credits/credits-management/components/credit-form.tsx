'use client';
import { IconWrapper } from '@/components/icon-wrapper';
import { useTypeSuppliers } from '@/constants/data';
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
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';
import { useTypeCredits } from '../../type-credits/hooks/use-query-type-credits';
import { useProducts } from '../hooks/use-query-products';
import {
  CREDIT_MODALITY,
  ESTATUS_TYPES,
} from '../schemas/credits-management-options';
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
  endDate?: string | Date; // <-- NUEVO: recibir endDate como prop
  initialData?: any; // <-- NUEVO: recibir initialData como prop
  isEdit?: boolean; // <-- NUEVO: recibir isEdit como prop
}

export function CreditForm({
  selectedAssociate,
  isSubmitting,
  onSubmit,
  onCancel,
  loanSummary,
  onFormChange,
  currentCurrencyCode,
  currentExchangeRate,
  endDate, // <-- NUEVO: recibir endDate como prop
  initialData,
  isEdit, // <-- NUEVO: recibir isEdit como prop
}: CreditFormProps) {
  const form = useForm<z.infer<typeof creditManagementSchema>>({
    resolver: zodResolver(creditManagementSchema),
    defaultValues:
      isEdit && initialData
        ? {
            id: initialData?.id,
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
            notes: initialData?.notes,
            commercialHouseId: initialData?.commercialHouseId,
            invoiceNumber: initialData?.invoiceNumber,
            products: initialData?.products || [],
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
            commercialHouseId: '',
            invoiceNumber: '',
            products: [],
          },
  });

  const { setValue, reset, watch, getValues, register } = form;

  const [exceedingAvailability, setExceedingAvailability] = useState(false);

  const { data: productsData } = useProducts();
  const availableProducts = productsData?.data || [];

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'products',
  });

  const commercialHouseId = watch('commercialHouseId');
  const selectedProducts = watch('products');
  const isCaprebicentenario = commercialHouseId === '1';
  const requestedAmountValue = watch('requestedAmount');
  const creditTypeId = watch('creditTypeId');
  const startDateValue = watch('startDate');
  const termMonthsValue = watch('termMonths');

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
    return `${amount.toFixed(2)}`; // Default to USD if currency code is not recognized
  };

  // Effect to update requestedAmount based on selected products
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (
        isCaprebicentenario &&
        name &&
        (name.startsWith('products') || name === 'commercialHouseId')
      ) {
        const products = value.products || [];
        const totalCost = products.reduce((acc, p) => {
          const quantity = Number(p?.quantity) || 0;
          if (p && p.productId && quantity > 0) {
            const productDetails = availableProducts.find(
              (product) => product.id === Number(p.productId),
            );
            if (productDetails) {
              return acc + Number(productDetails.productPrice) * quantity;
            }
          }
          return acc;
        }, 0);

        if (getValues('requestedAmount') !== totalCost.toFixed(2)) {
          setValue('requestedAmount', totalCost.toFixed(2), {
            shouldValidate: true,
          });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, isCaprebicentenario, availableProducts, setValue, getValues]);

  useEffect(() => {
    // Si se cambia fuera del modo inventario, limpiar los productos y el monto.
    if (!isCaprebicentenario) {
      setValue('requestedAmount', '');
      remove(); // Elimina todos los campos del array de productos
    }
  }, [isCaprebicentenario, setValue, remove]);

  // <-- Agrega este efecto para resetear el formulario cuando initialData cambie
  useEffect(() => {
    if (isEdit && initialData) {
      reset({
        id: initialData?.id,
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
        notes: initialData?.notes,
        commercialHouseId: initialData?.commercialHouseId,
        invoiceNumber: initialData?.invoiceNumber,
      });
    }
  }, [isEdit, initialData, reset]);

  const { data: creditTypes } = useTypeCredits();

  const { data: suppliersType } = useTypeSuppliers();

  // Determine if the associate is blocked
  const isAssociateBlocked =
    selectedAssociate !== null &&
    (selectedAssociate.totalCredits > 0 ||
      selectedAssociate.associate.isPayrollCredit === true);

  // Actualizar el associateId cuando cambia el asociado seleccionado
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
        commercialHouseId: '',
        invoiceNumber: '',
      });
    }
  }, [selectedAssociate, setValue, reset]);

  // Actualizar la tasa de interés cuando cambia el tipo de préstamo
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

  // Sincronizar para que la fecha de finalización se calcule automáticamente
  useEffect(() => {
    if (startDateValue && termMonthsValue) {
      const start = new Date(startDateValue as string | Date);
      const monthsToAdd = parseInt(termMonthsValue as string);
      if (!isNaN(start.getTime()) && !isNaN(monthsToAdd)) {
        const newDate = new Date(start);
        newDate.setMonth(newDate.getMonth() + monthsToAdd);
        const calculatedEndDate = newDate.toISOString().split('T')[0];
        if (getValues('endDate') !== calculatedEndDate) {
          setValue('endDate', calculatedEndDate, {
            shouldDirty: true,
          });
        }
      }
    }
  }, [startDateValue, termMonthsValue, setValue, getValues]);

  // Notificar cambios en el formulario al componente padre
  useEffect(() => {
    const subscription = watch((value) => {
      onFormChange(value);
    });
    return () => subscription.unsubscribe();
  }, [watch, onFormChange]);

  // Función para manejar el envío del formulario
  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
  });

  const handleCancel = () => {
    form.reset();
    onCancel();
  };

  //Verificar si el monto solicitado excede la disponibilidad
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
          <IconWrapper color="purple" className="w-8 h-8">
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
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <FormField
                control={form.control}
                name="creditTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Crédito</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={
                        !selectedAssociate || isSubmitting || isAssociateBlocked
                      } // <-- Added isAssociateBlocked
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
                control={form.control}
                name="creditModality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modalidad</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={
                        !selectedAssociate || isSubmitting || isAssociateBlocked
                      } // <-- Added isAssociateBlocked
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

              <FormField
                control={form.control}
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
                        } // <-- Added isAssociateBlocked
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
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
                        } // <-- Added isAssociateBlocked
                        minDate={new Date()}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
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
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estatus</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={
                        !selectedAssociate || isSubmitting || isAssociateBlocked
                      } // <-- Added isAssociateBlocked
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
                          ) // <-- FILTRO APLICADO AQUÍ
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
              />
            </div>

            <FormField
              control={form.control}
              name="commercialHouseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Casa Comercial</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={
                      !selectedAssociate || isSubmitting || isAssociateBlocked
                    } // <-- Added isAssociateBlocked
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccione el tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suppliersType?.map((type) => (
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

            {isCaprebicentenario && (
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
                    onClick={() => append({ productId: '', quantity: 1 })}
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
                                  control={form.control}
                                  name={`products.${index}.productId`}
                                  render={({ field: selectField }) => (
                                    <FormItem>
                                      <Select
                                        onValueChange={selectField.onChange}
                                        defaultValue={selectField.value}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Seleccione..." />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {availableProducts.map((product) => {
                                            const isSelectedInAnotherRow =
                                              selectedProductIdsInForm.includes(
                                                String(product.id),
                                              ) &&
                                              String(product.id) !==
                                                selectedProductId;
                                            return (
                                              <SelectItem
                                                key={product.id}
                                                value={String(product.id)}
                                                disabled={
                                                  isSelectedInAnotherRow
                                                }
                                              >
                                                {product.name}
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
                                  control={form.control}
                                  name={`products.${index}.quantity`}
                                  render={({ field: inputField }) => (
                                    <FormItem>
                                      <Input
                                        type="number"
                                        min="1"
                                        max={
                                          productDetails?.available ?? undefined
                                        } // ← aquí
                                        {...inputField}
                                        onChange={(e) =>
                                          inputField.onChange(
                                            parseInt(e.target.value, 10) || 0,
                                          )
                                        }
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

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <FormField
                control={form.control}
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
                          } // <-- Added isAssociateBlocked
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
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
                          disabled={
                            !selectedAssociate ||
                            isSubmitting ||
                            isAssociateBlocked ||
                            isCaprebicentenario
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
                          } // <-- Added isAssociateBlocked
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ingrese cualquier observación relevante sobre el crédito"
                      className="resize-none"
                      {...field}
                      disabled={
                        !selectedAssociate || isSubmitting || isAssociateBlocked
                      } // <-- Added isAssociateBlocked
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
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Crédito Disponible
                      </p>
                      <p className="text-lg font-medium">
                        {currentCurrencyCode === 'VES' ? 'Bs ' : '$ '}{' '}
                        {loanSummary.totalAvailable}
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

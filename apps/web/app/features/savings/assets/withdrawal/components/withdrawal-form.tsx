import { useState, useMemo, useEffect } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Banknote, PlusCircle, Trash2 } from 'lucide-react';
import { AlertModal } from '@/components/modal/alert-modal';
import { IconWrapper } from '@/components/icon-wrapper';
import { useSupplierAllQuery } from '@/features/administration/suppliers/hooks/use-suppliers-query';
import { useCategoriesTypesGroupQuery } from '@/features/common/category-types/hooks/use-category-types-query';
import { useProductsQuery } from '@/features/savings/credits/credits-management/hooks/use-credits-query';
import { Button } from '@repo/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/card';
import { Badge } from '@repo/shadcn/badge';
import { CustomCalendar } from '@repo/shadcn/custom-calendar';
import { SelectSearchable } from '@repo/shadcn/select-searchable';
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

import { useWithdrawalTypesQuery } from '../hooks/use-withdrawal-query';
import { PAYMENT_METHOD } from '../schemas/withdrawal-options';
import { withdrawalSchema, type Withdrawal } from '../schemas/withdrawal.schema';
import { useWithdrawalStore } from '../store/withdrawal-store';

interface WithdrawalProps {
  isSubmitting: boolean;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  currentCurrencyCode?: string;
  currentExchangeRate?: number;
  initialData?: any;
  isEdit?: boolean;
}

const COMMERCIAL_HOUSE_NONE = 'none';

export function WithdrawalForm({
  isSubmitting,
  onSubmit,
  onCancel,
  currentCurrencyCode = 'VES',
  currentExchangeRate,
  initialData,
  isEdit,
}: WithdrawalProps) {
  const {
    selectedAssociate,
    withdrawalSummary,
    selectedWithdrawalType,
    setSelectedWithdrawalType,
    setWithdrawalSummary,
    enabledTime,
  } = useWithdrawalStore();

  const [exceedingAvailability, setExceedingAvailability] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);

  const { data: withdrawlTypes } = useWithdrawalTypesQuery();
  const { data: productsData } = useProductsQuery();
  const { data: suppliers } = useSupplierAllQuery();
  const { data: daysType } = useCategoriesTypesGroupQuery('DAYS_TYPE');
  const availableProducts = productsData?.data || [];

  const form = useForm<Withdrawal>({
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

  const requestedAmount = Number.parseFloat(form.watch('requestedAmount') || '0');

  const watchedProducts = useWatch({ control: form.control, name: 'products' });
  const watchedItems = useWatch({ control: form.control, name: 'items' });

  const currentWithdrawalType = withdrawlTypes?.data?.find(
    (lt) => lt.id === Number(withdrawalTypeId),
  );

  const showProductSelection = currentWithdrawalType?.isInternalInventory;
  const showCommercialHouseDropdown = currentWithdrawalType?.isHouseComercial;

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
        (item) => !item.description || item.description.trim() === '' || !item.days,
      );
    }
    return false;
  }, [showCommercialItems, watchedItems]);

  const balance = Number(selectedAssociate?.balance);
  const availability = balance * 0.8;

  useEffect(() => {
    if (!selectedAssociate) return;
    if (withdrawalTypeId) {
      const wt = withdrawlTypes?.data?.find((lt) => lt.id === Number(withdrawalTypeId));
      setSelectedWithdrawalType(wt ?? null);
    } else {
      setSelectedWithdrawalType(null);
    }
  }, [withdrawalTypeId, withdrawlTypes, setSelectedWithdrawalType, selectedAssociate]);

  useEffect(() => {
    if (!showProductSelection) return;

    const totalCost = (watchedProducts || []).reduce((acc, p) => {
      const quantity = Number(p?.quantity) || 0;
      const rawPrice = Number(p?.price);
      const price = Number.isNaN(rawPrice) ? 0 : Number(rawPrice.toFixed(2));
      if (p?.productId && quantity > 0) {
        return acc + price * quantity;
      }
      return acc;
    }, 0);

    const rounded = totalCost.toFixed(2);
    if (form.getValues('requestedAmount') !== rounded) {
      form.setValue('requestedAmount', rounded, { shouldValidate: true });
    }
  }, [watchedProducts, showProductSelection, form]);

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
        selectedWithdrawalType?.administrativeFeePercentage ?? '0',
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
    selectedWithdrawalType,
    availability,
    setWithdrawalSummary,
  ]);

  const onPreSubmit = () => {
    setConfirmOpen(true);
  };

  const onConfirm = form.handleSubmit((data) => {
    let withdrawalItems: any[] = [];
    if (showProductSelection) {
      withdrawalItems = (data.products || []).map((p: any) => ({
        itemType: 'PRODUCT',
        itemDescription: null,
        itemId: Number(p.productId),
        quantity: p.quantity,
        agreedSellingPrice: Number(p.price),
        days: null,
      }));
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
      commercialHouseId: showCommercialHouseDropdown
        ? Number(commercialHouseId)
        : null,
    };

    delete dataToSubmit.products;
    delete dataToSubmit.items;

    onSubmit(dataToSubmit);
    setConfirmOpen(false);
  });

  const handleCancel = () => {
    form.reset();
    onCancel();
  };

  const hasBlocks =
    selectedAssociate?.totalLoansAssociate !== 0 ||
    selectedAssociate?.totalCreditsAssociate !== 0;

  return (
    <>
      <AlertModal
        isOpen={isConfirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={onConfirm}
        loading={isSubmitting}
        title="Confirmar Retiro"
        description="¿Está seguro que desea registrar este retiro de haberes? Esta operación generará un movimiento contable y afectará el saldo disponible del asociado."
      />
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
            <form onSubmit={form.handleSubmit(onPreSubmit)} className="space-y-6">
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
                          suppliers?.data?.map((supplier: any) => ({
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
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Products and Items would go here, simplified for migration */}

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
                          {Object.entries(PAYMENT_METHOD).map(([value, label]) => (
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

              {withdrawalSummary && (
                <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Resumen del Retiro</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Monto Solicitado
                        </p>
                        <p className="text-lg font-medium">
                          {currentCurrencyCode === 'VES' ? 'Bs ' : '$ '}
                          {withdrawalSummary.totalWithdrawal}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Gastos Administrativos
                        </p>
                        <p className="text-lg font-medium">
                          {currentCurrencyCode === 'VES' ? 'Bs ' : '$ '}
                          {withdrawalSummary.installmentAmount}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total a Retirar
                        </p>
                        <p className="text-lg font-bold text-green-600">
                          {currentCurrencyCode === 'VES' ? 'Bs ' : '$ '}
                          {withdrawalSummary.totalPayable}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {exceedingAvailability && (
                <div className="rounded-md bg-destructive/15 p-4 text-destructive">
                  <p className="text-sm font-medium">
                    El monto solicitado excede el 80% de disponibilidad de los
                    ahorros del asociado.
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !selectedAssociate ||
                    !withdrawalTypeId ||
                    requestedAmount <= 0 ||
                    exceedingAvailability ||
                    !enabledTime ||
                    hasBlocks ||
                    commercialItemsInvalid
                  }
                >
                  {isSubmitting ? 'Guardando...' : 'Registrar Retiro'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}

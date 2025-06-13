'use client';
import { IconWrapper } from '@/components/icon-wrapper';
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
import { Banknote, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
  initialData?: any; // <-- NUEVO: recibir initialData como prop
  isEdit?: boolean; // <-- NUEVO: recibir isEdit como prop
}

export function WithdrawalForm({
  isSubmitting,
  onSubmit,
  onCancel,
  currentCurrencyCode,
  currentExchangeRate,
  initialData,
  isEdit, // <-- NUEVO: recibir isEdit como prop
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
  const form = useForm<z.infer<typeof withdrawalSchema>>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      id: 0,
      associateAccountId: 0,
      withdrawalDate: new Date(),
      withdrawalTypeId: 0,
      requestedAmount: '',
      paymentMethod: 'BANK_TRANSFER',
    },
  });

  //Actualizar el associateId cuando cambia el asociado seleccionado
  useEffect(() => {
    if (selectedAssociate) {
      form.setValue('associateAccountId', selectedAssociate.associateAccountId);
    } else {
      form.setValue('id', 0);
    }
  }, [selectedAssociate, form]);

  const withdrawalType = useWatch({
    control: form.control,
    name: 'withdrawalTypeId',
  });

  const requestedAmount = Number.parseFloat(
    form.watch('requestedAmount') || '0',
  );

  const balance = Number(selectedAssociate?.balance);
  const availability = balance * 0.8;

  useEffect(() => {
    if (!selectedAssociate) return;
    if (withdrawalType) {
      const withdrawlType = withdrawlTypes?.data?.find(
        (lt) => lt.id === Number(withdrawalType),
      );
      setselectedWithdrawlType(withdrawlType ?? null);
    } else {
      setselectedWithdrawlType(null);
    }
  }, [withdrawalType]);

  useEffect(() => {
    if (!selectedAssociate) return;
    if (requestedAmount) {
      // Calcular resumen del préstamo
      const amount = requestedAmount; //monto soclitado
      const expenses = Number.parseFloat(
        selectedWithdrawlType?.administrativeFeePercentage ?? '0',
      ); //porcentaje de gastos
      const totalAdministrativeExpenses = (requestedAmount * expenses) / 100; //total de gasto administrativo
      const totalPayable = requestedAmount - totalAdministrativeExpenses;

      if (requestedAmount > availability) {
        setExceedingAvailability(true);
        setWithdrawalSummary(null);
      } else {
        setExceedingAvailability(false);
        setWithdrawalSummary({
          totalWithdrawal: amount.toFixed(2),
          totalPayable: totalPayable.toFixed(2),
          installmentAmount: totalAdministrativeExpenses.toFixed(2),
        });
      }
    } else if (requestedAmount === 0) {
      setWithdrawalSummary(null);
      setExceedingAvailability(false);
    }
  }, [requestedAmount]);

  // Función para manejar el envío del formulario
  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
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
          <IconWrapper color="purple" className="w-8 h-8">
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
                          disabled={
                            !selectedAssociate ||
                            isSubmitting ||
                            !enabledTime ||
                            hasBlocks
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
                  hasBlocks
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

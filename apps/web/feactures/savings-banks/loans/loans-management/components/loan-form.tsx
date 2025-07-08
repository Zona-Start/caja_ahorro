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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/shadcn/tabs';
import { Textarea } from '@repo/shadcn/textarea';
import { CalendarDays, Check, CreditCard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useTypeLoans } from '../../type-loans/hooks/use-query-type-loans';
import { AssociatesLoan } from '../schemas/individual-load-api-schema'; // Ensure this import exists
import {
  ESTATUS_TYPES,
  lOAN_MODALITY,
  PAYMENT_METHOD,
} from '../schemas/loans-management-options';
import { loanManagementSchema } from '../schemas/loans-management.schema';

interface LoanFormProps {
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

export function LoanForm({
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
}: LoanFormProps) {
  const form = useForm<z.infer<typeof loanManagementSchema>>({
    resolver: zodResolver(loanManagementSchema),
    defaultValues:
      isEdit && initialData
        ? {
            id: initialData?.id,
            loanTypeId: initialData?.loanTypeId,
            loanModality: initialData?.loanModality,
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
            paymentMethod: initialData?.paymentMethod,
            disbursementAccountId: initialData?.disbursementAccountId,
            interestRate: initialData?.interestRate,
            installmentsCount: initialData?.termMonths,
            expensesAmount: initialData?.expensesAmount,
            overdraftAmount: String(
              parseInt(initialData?.overdraftAmount).toFixed(2),
            ),
            notes: initialData?.notes,
          }
        : {
            id: '0',
            loanTypeId: '',
            loanModality: '',
            requestDate: new Date(),
            requestedAmount: '',
            startDate: new Date(),
            endDate: '',
            termMonths: '',
            status: 'REQUESTED',
            paymentMethod: '',
            disbursementAccountId: undefined,
            interestRate: '',
            installmentsCount: '',
            expensesAmount: '',
            overdraftAmount: null,
            notes: '',
          },
  });

  const [exceedingAvailability, setExceedingAvailability] = useState(false);

  // <-- Agrega este efecto para resetear el formulario cuando initialData cambie
  useEffect(() => {
    if (isEdit && initialData) {
      form.reset({
        id: initialData?.id,
        loanTypeId: initialData?.loanTypeId,
        loanModality: initialData?.loanModality,
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
        paymentMethod: initialData?.paymentMethod,
        disbursementAccountId: initialData?.disbursementAccountId,
        interestRate: initialData?.interestRate,
        installmentsCount: initialData?.termMonths,
        expensesAmount: initialData?.expensesAmount,
        overdraftAmount: String(
          parseInt(initialData?.overdraftAmount).toFixed(2),
        ),
        notes: initialData?.notes,
      });
    }
  }, [isEdit, initialData]);

  const { data: loanTypes } = useTypeLoans();

  // Determine if the associate is blocked
  const isAssociateBlocked =
    selectedAssociate !== null &&
    (selectedAssociate.totalLoans > 0 ||
      selectedAssociate.associate.isPayrollCredit === true);

  // Actualizar el associateId cuando cambia el asociado seleccionado
  useEffect(() => {
    if (selectedAssociate) {
      form.setValue('associateId', selectedAssociate.associate.id);
    } else {
      form.setValue('associateId', 0);
      form.reset({
        id: '0',
        loanTypeId: '',
        loanModality: '',
        requestDate: new Date(),
        requestedAmount: '',
        startDate: new Date(),
        endDate: '',
        termMonths: '',
        status: 'REQUESTED',
        paymentMethod: '',
        disbursementAccountId: undefined,
        interestRate: '',
        installmentsCount: '',
        expensesAmount: '',
        overdraftAmount: null,
        notes: '',
      });
    }
  }, [selectedAssociate, form]);

  // Actualizar la tasa de interés cuando cambia el tipo de préstamo
  useEffect(() => {
    const loanTypeId = form.watch('loanTypeId');
    if (loanTypeId) {
      const loanType = loanTypes?.data?.find(
        (lt) => lt.id === Number(loanTypeId),
      );
      if (loanType) {
        form.setValue(
          'interestRate',
          parseInt(loanType.interestRate).toString(),
        );
        form.setValue('termMonths', String(Math.floor(loanType.termUnits)));
        form.setValue('installmentsCount', loanType.termUnits.toString());
        form.setValue(
          'expensesAmount',
          parseInt(loanType?.administrativeExpensePercentage ?? '0').toString(),
        );
      }
    }
  }, [form.watch('loanTypeId'), form]);

  // Sincronizar para que la fecha de finalización se calcule automáticamente
  useEffect(() => {
    const subscription = form.watch((values, { name, type }) => {
      // Solo recalcula si cambian startDate o termMonths
      if (name === 'startDate' || name === 'termMonths') {
        const { startDate, termMonths } = values;
        if (startDate && termMonths) {
          const start = new Date(startDate as string | Date);
          const monthsToAdd = parseInt(termMonths as string);
          if (!isNaN(start.getTime()) && !isNaN(monthsToAdd)) {
            const newDate = new Date(start);
            newDate.setMonth(newDate.getMonth() + monthsToAdd);
            const calculatedEndDate = newDate.toISOString().split('T')[0];
            // Solo actualiza si el valor realmente cambió
            if (form.getValues('endDate') !== calculatedEndDate) {
              form.setValue('endDate', calculatedEndDate, {
                shouldDirty: true,
              });
            }
          }
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Notificar cambios en el formulario al componente padre
  useEffect(() => {
    const subscription = form.watch((value) => {
      onFormChange(value);
    });
    return () => subscription.unsubscribe();
  }, [form, onFormChange]);

  // Función para manejar el envío del formulario
  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
  });

  const handleCancel = () => {
    form.reset();
    onCancel();
  };

  //Verificar si el monto solicitado excede la disponibilidad
  const requestedAmount = Number.parseFloat(
    form.watch('requestedAmount') || '0',
  );

  useEffect(() => {
    if (!selectedAssociate) return;
    if (requestedAmount) {
      // Calcular resumen del préstamo
      const amount = requestedAmount; //monto soclitado
      const balance = Number(selectedAssociate?.associate.balance);
      const availability = balance * 0.8;
      if (amount > availability) {
        setExceedingAvailability(true);
      } else {
        setExceedingAvailability(false);
      }
    } else if (requestedAmount === 0) {
      setExceedingAvailability(false);
    }
  }, [requestedAmount]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconWrapper color="purple" className="w-8 h-8">
            <CreditCard />
          </IconWrapper>
          Datos del Préstamo
        </CardTitle>
        <CardDescription>
          Ingrese la información del préstamo a otorgar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">Información General</TabsTrigger>
                <TabsTrigger value="payment">Pago y Desembolso</TabsTrigger>
                <TabsTrigger value="additional">
                  Información Adicional
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-6 pt-4">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="loanTypeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Préstamo</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={
                            !selectedAssociate ||
                            isSubmitting ||
                            isAssociateBlocked
                          } // <-- Added isAssociateBlocked
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Seleccione el tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {loanTypes?.data?.map((type) => (
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
                    name="loanModality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modalidad</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={
                            !selectedAssociate ||
                            isSubmitting ||
                            isAssociateBlocked
                          } // <-- Added isAssociateBlocked
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Seleccione el tipo" />
                            </SelectTrigger>
                          </FormControl>

                          <SelectContent>
                            {Object.entries(lOAN_MODALITY).map(
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

                <FormField
                  control={form.control}
                  name="requestedAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto del Préstamo</FormLabel>
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
                              isAssociateBlocked
                            } // <-- Added isAssociateBlocked
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                      {/* {isAmountExceedingAvailability && (
                        <p className="text-sm font-medium text-destructive">
                          El monto excede la disponibilidad del asociado
                        </p>
                      )} */}
                    </FormItem>
                  )}
                />
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
                            !selectedAssociate ||
                            isSubmitting ||
                            isAssociateBlocked
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
                                ['REQUESTED', 'APPROVED', 'REJECTED'].includes(
                                  value,
                                ),
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
              </TabsContent>

              <TabsContent value="payment" className="space-y-6 pt-4">
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método de Pago</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={
                          !selectedAssociate ||
                          isSubmitting ||
                          isAssociateBlocked
                        } // <-- Added isAssociateBlocked
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione el método de pago" />
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

                <FormField
                  control={form.control}
                  name="disbursementAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cuenta de Desembolso de Pagos</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={
                          !selectedAssociate ||
                          isSubmitting ||
                          selectedAssociate.associate.associateAccountId ===
                            0 ||
                          isAssociateBlocked // <-- Added isAssociateBlocked
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione la cuenta" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {/* Opción adicional: accountNumber principal del asociado */}
                          {selectedAssociate?.associate.accountNumber && (
                            <SelectItem
                              key={
                                selectedAssociate.associate.associateAccountId
                              }
                              value={String(
                                selectedAssociate.associate.associateAccountId,
                              )}
                            >
                              {selectedAssociate.associate.accountNumber} -
                              Principal
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
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
              </TabsContent>

              <TabsContent value="additional" className="space-y-6 pt-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observaciones</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ingrese cualquier observación relevante sobre el préstamo"
                          className="resize-none"
                          {...field}
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
              </TabsContent>
            </Tabs>

            {loanSummary && !exceedingAvailability && (
              <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Resumen del Préstamo
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
                        Total Préstamo a Pagar
                      </p>
                      <p className="text-lg font-medium">
                        {currentCurrencyCode === 'VES' ? 'Bs ' : '$ '}{' '}
                        {loanSummary.totalPayable}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Monto Desembolso
                      </p>
                      <p className="text-lg font-medium">
                        {currentCurrencyCode === 'VES' ? 'Bs ' : '$ '}{' '}
                        {loanSummary.totalDisbursement}
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
                    {isEdit ? 'Actualizar Préstamo' : 'Crear Préstamo'}
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

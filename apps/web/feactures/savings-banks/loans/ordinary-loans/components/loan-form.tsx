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
import { Check, Clock, CreditCard, Percent } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

// Simulación de tipos de préstamos
const loanTypes = [
  { id: 'personal', name: 'Personal', maxTerm: 36, interestRate: 12.5 },
  { id: 'hipotecario', name: 'Hipotecario', maxTerm: 240, interestRate: 8.5 },
  { id: 'vehicular', name: 'Vehicular', maxTerm: 60, interestRate: 10.0 },
  { id: 'educativo', name: 'Educativo', maxTerm: 48, interestRate: 7.5 },
];

// Esquema de validación del formulario
const formSchema = z.object({
  associateId: z.string({
    required_error: 'Por favor seleccione un asociado',
  }),
  loanTypeId: z.string({
    required_error: 'Por favor seleccione el tipo de préstamo',
  }),
  requestedAmount: z.string().min(1, {
    message: 'Por favor ingrese el monto del préstamo',
  }),
  termMonths: z.string().min(1, {
    message: 'Por favor ingrese el plazo en meses',
  }),
  interestRate: z.string().min(1, {
    message: 'Por favor ingrese la tasa de interés',
  }),
  installmentsCount: z.string().min(1, {
    message: 'Por favor ingrese el número de cuotas',
  }),
  startDate: z.date({
    required_error: 'Por favor seleccione la fecha de inicio',
  }),
  paymentMethod: z.string({
    required_error: 'Por favor seleccione el método de pago',
  }),
  disbursementAccountId: z.string({
    required_error: 'Por favor seleccione la cuenta de desembolso',
  }),
  expensesAmount: z.string().optional(),
  overdraftAmount: z.string().optional(),
  notes: z.string().optional(),
});

// Simulación de cuentas de asociados
const associateAccounts = [
  {
    id: '1',
    associateId: '1',
    accountNumber: '1001-001',
    accountType: 'Ahorro',
  },
  {
    id: '2',
    associateId: '1',
    accountNumber: '1001-002',
    accountType: 'Corriente',
  },
  {
    id: '3',
    associateId: '2',
    accountNumber: '1002-001',
    accountType: 'Ahorro',
  },
  {
    id: '4',
    associateId: '3',
    accountNumber: '1003-001',
    accountType: 'Ahorro',
  },
  {
    id: '5',
    associateId: '4',
    accountNumber: '1004-001',
    accountType: 'Ahorro',
  },
  {
    id: '6',
    associateId: '4',
    accountNumber: '1004-002',
    accountType: 'Corriente',
  },
];

interface LoanFormProps {
  selectedAssociate: any | null;
  isSubmitting: boolean;
  onSubmit: (data: any) => void;
  loanSummary: any | null;
  onFormChange: (values: any) => void;
}

export function LoanForm({
  selectedAssociate,
  isSubmitting,
  onSubmit,
  loanSummary,
  onFormChange,
}: LoanFormProps) {
  // Inicializar el formulario
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      requestedAmount: '',
      termMonths: '',
      interestRate: '',
      installmentsCount: '',
      expensesAmount: '',
      overdraftAmount: '',
      notes: '',
    },
  });

  // Filtrar cuentas disponibles para el asociado seleccionado
  const availableAccounts = selectedAssociate
    ? associateAccounts.filter(
        (acc) => acc.associateId === selectedAssociate.id,
      )
    : [];

  // Actualizar el associateId cuando cambia el asociado seleccionado
  useEffect(() => {
    if (selectedAssociate) {
      form.setValue('associateId', selectedAssociate.id);
    } else {
      form.setValue('associateId', '');
      form.reset({
        associateId: undefined,
        loanTypeId: undefined,
        requestedAmount: '',
        termMonths: '',
        interestRate: '',
        installmentsCount: '',
        startDate: undefined,
        paymentMethod: undefined,
        disbursementAccountId: undefined,
        expensesAmount: '',
        overdraftAmount: '',
        notes: '',
      });
    }
  }, [selectedAssociate, form]);

  // Actualizar la tasa de interés cuando cambia el tipo de préstamo
  useEffect(() => {
    const loanTypeId = form.watch('loanTypeId');
    if (loanTypeId) {
      const loanType = loanTypes.find((lt) => lt.id === loanTypeId);
      if (loanType) {
        form.setValue('interestRate', loanType.interestRate.toString());
      }
    }
  }, [form.watch('loanTypeId'), form]);

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

  // Verificar si el monto solicitado excede la disponibilidad
  const requestedAmount = Number.parseFloat(
    form.watch('requestedAmount') || '0',
  );
  const isAmountExceedingAvailability =
    selectedAssociate && requestedAmount > selectedAssociate.availability;

  // Obtener el tipo de préstamo seleccionado
  const selectedLoanType = loanTypes.find(
    (lt) => lt.id === form.watch('loanTypeId'),
  );

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
                <FormField
                  control={form.control}
                  name="loanTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Préstamo</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={!selectedAssociate || isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione el tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loanTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
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
                  name="requestedAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto del Préstamo</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                            $
                          </span>
                          <Input
                            className="pl-7"
                            placeholder="0.00"
                            {...field}
                            disabled={!selectedAssociate || isSubmitting}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                      {isAmountExceedingAvailability && (
                        <p className="text-sm font-medium text-destructive">
                          El monto excede la disponibilidad del asociado
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="termMonths"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plazo (meses)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              min="1"
                              {...field}
                              disabled={!selectedAssociate || isSubmitting}
                            />
                            <Clock className="absolute right-3 top-2.5 h-4 w-4 text-gray-500" />
                          </div>
                        </FormControl>
                        <FormMessage />
                        {selectedLoanType &&
                          Number.parseInt(field.value || '0') >
                            selectedLoanType.maxTerm && (
                            <p className="text-sm font-medium text-amber-600">
                              Excede el plazo máximo recomendado (
                              {selectedLoanType.maxTerm} meses)
                            </p>
                          )}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="interestRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tasa de Interés Anual (%)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              {...field}
                              disabled={!selectedAssociate || isSubmitting}
                            />
                            <Percent className="absolute right-3 top-2.5 h-4 w-4 text-gray-500" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="installmentsCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Cuotas</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            disabled={!selectedAssociate || isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Fecha Egreso</FormLabel>
                      <FormControl>
                        <CustomCalendar
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="Seleccione la fecha"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                        disabled={!selectedAssociate || isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione el método de pago" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="TRANSFER">
                            Transferencia
                          </SelectItem>
                          <SelectItem value="CHECK">Cheque</SelectItem>
                          <SelectItem value="CASH">Efectivo</SelectItem>
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
                      <FormLabel>Cuenta de Desembolso</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={
                          !selectedAssociate ||
                          isSubmitting ||
                          availableAccounts.length === 0
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione la cuenta" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.accountNumber} - {account.accountType}
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
                  name="expensesAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gastos Administrativos</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                            $
                          </span>
                          <Input
                            className="pl-7"
                            placeholder="0.00"
                            {...field}
                            disabled={!selectedAssociate || isSubmitting}
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
                            disabled={!selectedAssociate || isSubmitting}
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
                          disabled={!selectedAssociate || isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            {loanSummary && (
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
                        ${loanSummary.installmentAmount}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Interés Total
                      </p>
                      <p className="text-lg font-medium">
                        ${loanSummary.totalInterest}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total a Pagar
                      </p>
                      <p className="text-lg font-medium">
                        ${loanSummary.totalPayable}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => form.reset()}
                disabled={!selectedAssociate || isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  !selectedAssociate ||
                  isSubmitting ||
                  isAmountExceedingAvailability
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
                    Crear Préstamo
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

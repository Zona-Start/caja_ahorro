'use client';

import { AlertModal } from '@/components/shared/alert-modal';
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
import { Badge } from '@repo/shadcn/badge';
import { CustomCalendar } from '@repo/shadcn/custom-calendar';
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
import { useTypeLoansQuery } from '../type-loans/hooks/use-type-loans-query';
import { type AssociatesLoan } from '../schemas/individual-loan-api-schema';
import {
  lOAN_MODALITY,
  PAYMENT_METHOD,
} from '../schemas/loans-management-options';
import { loanManagementSchema, type LoanManagement } from '../schemas/loans-management.schema';

interface LoanFormProps {
  selectedAssociate: AssociatesLoan | null;
  isSubmitting: boolean;
  onSubmit: (data: LoanManagement) => void;
  onCancel: () => void;
  loanSummary: any | null;
  onFormChange: (values: any) => void;
  currentCurrencyCode?: string;
  currentExchangeRate?: number;
  initialData?: any;
  isEdit?: boolean;
}

export function LoanForm({
  selectedAssociate,
  isSubmitting,
  onSubmit,
  onCancel,
  loanSummary,
  onFormChange,
  currentCurrencyCode = 'VES',
  currentExchangeRate,
  initialData,
  isEdit,
}: LoanFormProps) {
  const form = useForm<LoanManagement>({
    resolver: zodResolver(loanManagementSchema),
    defaultValues: initialData || {
      id: '0',
      associateId: 0,
      creditTypeId: '',
      creditModality: '',
      requestDate: new Date(),
      requestedAmount: '',
      startDate: new Date(),
      endDate: '',
      termUnits: '',
      termType: 'Plazos',
      status: 'REQUESTED',
      paymentMethod: '',
      disbursementAccountId: '',
      interestRate: '',
      expensesAmount: '',
      overdraftAmount: null,
      notes: '',
    },
  });

  const [exceedingAvailability, setExceedingAvailability] = useState(false);
  const [exceedingPaymentCapacity, setExceedingPaymentCapacity] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [dataToSubmit, setDataToSubmit] = useState<any>(null);

  const { data: loanTypes } = useTypeLoansQuery();

  const isAssociateBlocked =
    selectedAssociate !== null &&
    (selectedAssociate.totalLoans > 0 ||
      selectedAssociate.totalCredits > 0 ||
      selectedAssociate.associate.isPayrollCredit === true);

  useEffect(() => {
    if (selectedAssociate) {
      form.setValue('associateId', selectedAssociate.associate.id);
    }
  }, [selectedAssociate, form]);

  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      if (name === 'startDate' || name === 'termUnits' || name === 'termType') {
        const { startDate, termUnits, termType } = values;
        if (startDate && termUnits && termType) {
          const start = new Date(startDate as string | Date);
          const units = parseInt(termUnits as string);
          if (!isNaN(start.getTime()) && !isNaN(units) && units > 0) {
            const daysPerInstallment = termType === 'Plazos' ? 15 : 30;
            const totalDays = units * daysPerInstallment;
            const newDate = new Date(start);
            newDate.setDate(newDate.getDate() + totalDays);
            const calculatedEndDate = newDate.toISOString().split('T')[0];
            if (form.getValues('endDate') !== calculatedEndDate) {
              form.setValue('endDate', calculatedEndDate, { shouldDirty: true });
            }
          }
        }
      }
      onFormChange(values);
    });
    return () => subscription.unsubscribe();
  }, [form, onFormChange]);

  const handleSubmit = form.handleSubmit((data) => {
    setDataToSubmit(data);
    setConfirmOpen(true);
  });

  const onConfirm = () => {
    onSubmit(dataToSubmit);
    setConfirmOpen(false);
  };

  const requestedAmount = Number.parseFloat(form.watch('requestedAmount') || '0');

  useEffect(() => {
    if (!selectedAssociate) return;
    const balance = Number(selectedAssociate.associate.balance);
    const availability = balance * 0.8;
    setExceedingAvailability(requestedAmount > availability);
  }, [requestedAmount, selectedAssociate]);

  return (
    <>
      <AlertModal
        isOpen={isConfirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={onConfirm}
        loading={isSubmitting}
        title="Confirmar Registro de Préstamo"
        description="¿Está seguro que desea otorgar este préstamo al asociado?"
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconWrapper className="w-8 h-8"><CreditCard /></IconWrapper>
            Datos del Préstamo
          </CardTitle>
          <CardDescription>Ingrese la información del préstamo</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="general">Información General</TabsTrigger>
                  <TabsTrigger value="payment">Pago y Desembolso</TabsTrigger>
                  <TabsTrigger value="additional">Info. Adicional</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general" className="space-y-6 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="creditTypeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Préstamo</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedAssociate || isSubmitting || isAssociateBlocked}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Seleccione el tipo" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {loanTypes?.data?.map((type: any) => (
                                <SelectItem key={type.id} value={String(type.id)}>{type.name}</SelectItem>
                              ))}
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
                        <FormItem>
                          <FormLabel>Fecha Solicitud</FormLabel>
                          <FormControl>
                            <CustomCalendar value={field.value} onChange={field.onChange} disabled={!selectedAssociate || isSubmitting || isAssociateBlocked} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Más campos aquí */}
                  </div>
                </TabsContent>
                <TabsContent value="payment" className="space-y-6 pt-4">
                    {/* Campos de pago */}
                </TabsContent>
              </Tabs>

              <div className="flex justify-end space-x-4">
                <Button variant="outline" type="button" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting || !selectedAssociate || isAssociateBlocked || exceedingAvailability}>
                  {isEdit ? 'Actualizar Préstamo' : 'Crear Préstamo'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}

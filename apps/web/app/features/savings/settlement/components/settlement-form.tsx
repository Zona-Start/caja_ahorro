'use client';
import { IconWrapper } from '@/components/icon-wrapper';
import { AlertModal } from '@/components/modal/alert-modal';
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
import { Banknote, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { useBanksQuery } from '@/features/banks/bank-directory/hooks/use-banks-query';
import { SelectSearchable } from '@repo/shadcn/components/ui/select-searchable';
import { Textarea } from '@repo/shadcn/textarea';
import { PAYMENT_METHOD } from '../schemas/settlement-options';
import { settlementSchema, type Settlement } from '../schemas/settlement.schema';
import { useSettlementStore } from '../store/settlement-store';

interface SettlementProps {
  isSubmitting: boolean;
  onSubmit: (data: Settlement) => void;
  onCancel: () => void;
  currentCurrencyCode: string | undefined;
  currentExchangeRate: number | undefined;
}

export function SettlementForm({
  isSubmitting,
  onSubmit,
  onCancel,
  currentCurrencyCode,
  currentExchangeRate,
}: SettlementProps) {
  const { selectedAssociate } = useSettlementStore();
  const { data: Banks } = useBanksQuery();
  const [openConfirm, setOpenConfirm] = useState(false);
  const [dataToSubmit, setDataToSubmit] = useState<any>(null);

  const form = useForm<z.infer<typeof settlementSchema>>({
    resolver: zodResolver(settlementSchema),
    defaultValues: {
      id: 0,
      associateId: 0,
      liquidationDate: undefined,
      netLiquidationAmount: 0,
      totalOutstandingCreditsAtLiquidation: 0,
      totalOutstandingLoansAtLiquidation: 0,
      totalSavingsBalanceAtLiquidation: 0,
      notes: '',
      paymentMethod: 'BANK_TRANSFER',
      hasBeneficiary: false,
      beneficiary: [],
    },
  });

  const hasBeneficiary = form.watch('hasBeneficiary');

  useEffect(() => {
    if (selectedAssociate) {
      const associate = selectedAssociate as any;
      form.setValue('associateId', associate.associate_id);
      form.setValue('netLiquidationAmount', Number(associate.net_liquidation_amount));
      form.setValue('totalOutstandingCreditsAtLiquidation', Number(associate.total_outstanding_credits));
      form.setValue('totalOutstandingLoansAtLiquidation', Number(associate.total_outstanding_loans));
      form.setValue('totalSavingsBalanceAtLiquidation', Number(associate.total_savings_balance));
      form.setValue('hasBeneficiary', false);
      form.setValue('beneficiary', []);
      form.clearErrors('beneficiary');
    } else {
      form.reset();
    }
  }, [selectedAssociate, form]);

  const handleSubmit = form.handleSubmit((data) => {
    const dataToSend = {
      ...data,
      beneficiary: data.hasBeneficiary ? data.beneficiary : null,
    };
    setDataToSubmit(dataToSend);
    setOpenConfirm(true);
  });

  const onConfirmSubmit = () => {
    if (dataToSubmit) {
      onSubmit(dataToSubmit);
    }
    setOpenConfirm(false);
    setDataToSubmit(null);
  };

  const handleCancel = () => {
    form.reset();
    onCancel();
  };

  return (
    <>
      <AlertModal
        isOpen={openConfirm}
        onClose={() => setOpenConfirm(false)}
        onConfirm={onConfirmSubmit}
        loading={isSubmitting}
        title="¿Está seguro de procesar la liquidación?"
        description="Esta acción creará una solicitud de liquidación para el asociado."
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconWrapper className="w-8 h-8">
              <Banknote />
            </IconWrapper>
            Datos de la Liquidación
          </CardTitle>
          <CardDescription>
            Ingrese la información de la liquidación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="liquidationDate"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Fecha de Solicitud</FormLabel>
                      <FormControl>
                        <CustomCalendar
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="Seleccione la fecha"
                          disabled={!selectedAssociate || isSubmitting}
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
                      <FormLabel>Método de Pago</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={!selectedAssociate || isSubmitting}
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

              <FormField
                control={form.control}
                name="hasBeneficiary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>¿Otro beneficiario?</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value === 'true');
                        if (value === 'false') {
                          form.setValue('beneficiary', []);
                          form.clearErrors('beneficiary');
                        } else {
                          const beneficiary = form.getValues('beneficiary');
                          if (!beneficiary || (Array.isArray(beneficiary) && beneficiary.length === 0)) {
                            form.setValue('beneficiary', [
                              {
                                fullname: '',
                                cedula: '',
                                phone: '',
                                accountNumber: '',
                                bankDirectoryId: 0,
                              },
                            ]);
                          }
                        }
                      }}
                      value={field.value ? 'true' : 'false'}
                      disabled={!selectedAssociate || isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="false">No</SelectItem>
                        <SelectItem value="true">Sí</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {hasBeneficiary && (
                <div className="space-y-4 rounded-md border p-4">
                  <p className="text-md font-semibold mb-2">Datos del Beneficiario</p>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="beneficiary.0.fullname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre Completo Beneficiario</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre y Apellido" {...field} disabled={isSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="beneficiary.0.cedula"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cédula Beneficiario</FormLabel>
                          <FormControl>
                            <Input placeholder="12345678" {...field} disabled={isSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="beneficiary.0.phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono Beneficiario</FormLabel>
                          <FormControl>
                            <Input placeholder="04141234567" {...field} disabled={isSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="beneficiary.0.accountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de Cuenta Beneficiario</FormLabel>
                          <FormControl>
                            <Input placeholder="xxxxxxxxxxxxxxxxxxxx" {...field} disabled={isSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="beneficiary.0.bankDirectoryId"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Banco Beneficiario</FormLabel>
                        <SelectSearchable
                          options={
                            Banks?.data?.map((item: any) => ({
                              value: item.id!.toString(),
                              label: `${item.code} - ${item.name}`,
                            })) || []
                          }
                          onValueChange={(value) => field.onChange(Number(value))}
                          placeholder="Selecciona un banco"
                          defaultValue={field.value ? String(field.value) : ''}
                          disabled={isSubmitting}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observaciones</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ingrese cualquier observación relevante sobre la liquidación"
                        className="resize-none"
                        {...field}
                        disabled={!selectedAssociate || isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="totalSavingsBalanceAtLiquidation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Saldo Total Haberes</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                            {currentCurrencyCode === 'VES' ? 'Bs ' : '$ '}
                          </span>
                          <Input className="pl-8" placeholder="0.00" {...field} disabled />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="totalOutstandingLoansAtLiquidation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto de prestamos pendientes</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                            {currentCurrencyCode === 'VES' ? 'Bs ' : '$ '}
                          </span>
                          <Input className="pl-8" placeholder="0.00" {...field} disabled />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="totalOutstandingCreditsAtLiquidation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto de creditos pendientes</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                            {currentCurrencyCode === 'VES' ? 'Bs ' : '$ '}
                          </span>
                          <Input className="pl-8" placeholder="0.00" {...field} disabled />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="netLiquidationAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto total a liquidar</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                            {currentCurrencyCode === 'VES' ? 'Bs ' : '$ '}
                          </span>
                          <Input className="pl-8" placeholder="0.00" {...field} disabled />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button variant="outline" type="button" onClick={() => handleCancel()}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    !selectedAssociate ||
                    isSubmitting ||
                    !form.formState.isValid
                  }
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-1">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                      Procesando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Save className="h-4 w-4" />
                      Crear Solicitud Liquidación
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}

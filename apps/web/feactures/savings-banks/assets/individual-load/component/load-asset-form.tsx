'use client';

import { IconWrapper } from '@/components/icon-wrapper';
import { AlertModal } from '@/components/modal/alert-modal';
import { useBankAccountAll } from '@/feactures/banks/bank-account/hooks/use-query-bank-account';
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
import { Switch } from '@repo/shadcn/switch';
import { Textarea } from '@repo/shadcn/textarea';
import { Check, Coins, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ASSOCIATE_MOVEMENT_TYPES } from '../schemas/individual-load-options';
import { formSchema, LoadAssest } from '../schemas/individual-load-schema';
import { useIndividualLoadStore } from '../store/individual-load-store';

interface LoadAssetsFormProps {
  isSubmitting: boolean;
  onSubmit: (data: any) => void;
}

const PAYMENT_METHODS = {
  BANK_TRANSFER: 'Transferencia bancaria',
  MOBILE_PAYMENT: 'Pago Móvil',
  DEPOSIT: 'Depósito',
  CHECK: 'Cheque',
  CASH: 'Efectivo',
  OTHER: 'Otro',
};

export function LoadAssetsForm({
  isSubmitting,
  onSubmit,
}: LoadAssetsFormProps) {
  const { selectedAssociate, errors } = useIndividualLoadStore();
  const { data: bankAccountsData } = useBankAccountAll();
  const bankAccounts = bankAccountsData?.data || [];
  const [isConfirmOpen, setConfirmOpen] = useState(false);

  const form = useForm<LoadAssest>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      associateAccountId: 0,
      movementType: 'SAVING_CONTRIBUTION',
      amount: 0,
      employerAmount: 0,
      associateAmount: 0,
      transactionDate: new Date(),
      description: '',
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: '',
      includeBankingDetails: false, // Por defecto activo para mejores prácticas
    },
  });

  const movementType = form.watch('movementType');


  useEffect(() => {
    if (selectedAssociate) {
      form.setValue(
        'associateAccountId',
        selectedAssociate.associateAccountsId,
      );
    } else {
      // Limpiar todo el formulario si no hay asociado
      form.reset({
        associateAccountId: 0,
        movementType: 'SAVING_CONTRIBUTION',
        amount: 0,
        employerAmount: 0,
        associateAmount: 0,
        transactionDate: new Date(),
        description: '',
        paymentMethod: 'BANK_TRANSFER',
        referenceNumber: '',
        includeBankingDetails: false,
      });
    }
  }, [selectedAssociate, form]);

  const handleSubmit = form.handleSubmit((data: LoadAssest) => {
    const { includeBankingDetails, ...rest } = data;

    const dataTransform = {
      ...rest,
      bankAccountId: includeBankingDetails ? rest.bankAccountId : undefined,
      paymentMethod: includeBankingDetails ? rest.paymentMethod : undefined,
      referenceNumber: includeBankingDetails ? rest.referenceNumber : undefined,
    };

    onSubmit(dataTransform);
    setConfirmOpen(false);
  });

  const includeBankingDetails = form.watch('includeBankingDetails');
  const hasRestrictions = errors.length > 0;
  const isFormDisabled = !selectedAssociate || isSubmitting || hasRestrictions;

  return (
    <>
      <AlertModal
        isOpen={isConfirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleSubmit}
        loading={isSubmitting}
        title="Confirmar Depósito"
        description="¿Está seguro que desea registrar este movimiento de haberes? Esta operación generará un asiento contable automático."
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <IconWrapper className="w-8 h-8">
              <Coins />
            </IconWrapper>
            Detalles de la Carga
          </CardTitle>
          <CardDescription>
            Defina el monto y los conceptos de la carga individual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setConfirmOpen(true);
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="movementType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Movimiento</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isFormDisabled}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(ASSOCIATE_MOVEMENT_TYPES).map(
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
                  name="transactionDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Valor</FormLabel>
                      <FormControl>
                        <CustomCalendar
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          disabled={isFormDisabled}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                {movementType === 'EMPLOYER_CONTRIBUTION' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="employerAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-primary font-bold">
                            Monto Aporte Patrono (VES)
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
                                Bs.
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                className="pl-10 text-xl font-black h-12"
                                placeholder="0.00"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                                disabled={isFormDisabled}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="associateAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-primary font-bold">
                            Monto Aporte Asociado (VES)
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
                                Bs.
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                className="pl-10 text-xl font-black h-12"
                                placeholder="0.00"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                                disabled={isFormDisabled}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ) : (
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-bold">
                          Monto del Depósito (VES)
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
                              Bs.
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              className="pl-10 text-xl font-black h-12"
                              placeholder="0.00"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                              disabled={isFormDisabled}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Concepto / Observación</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ej. Depósito voluntario correspondiente al mes..."
                        className="resize-none"
                        {...field}
                        disabled={isFormDisabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                <FormField
                  control={form.control}
                  name="includeBankingDetails"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Datos Bancarios</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Vincular con movimiento en cuenta bancaria
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isFormDisabled}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {includeBankingDetails && (
                  <div className="space-y-4 pt-4 animate-in slide-in-from-top-2 duration-300">
                    <FormField
                      control={form.control}
                      name="bankAccountId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs uppercase font-bold text-muted-foreground">
                            Cuenta Receptora
                          </FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(Number(value))
                            }
                            value={String(field.value)}
                            disabled={isFormDisabled}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione cuenta bancaria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {bankAccounts.map((account) => (
                                <SelectItem
                                  key={account.id}
                                  value={String(account.id)}
                                >
                                  {account.accountName} -{' '}
                                  {account.accountNumber.slice(-4)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase font-bold text-muted-foreground">
                              Referencia / Pago
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isFormDisabled}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(PAYMENT_METHODS).map(
                                  ([k, v]) => (
                                    <SelectItem key={k} value={k}>
                                      {v}
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
                        name="referenceNumber"
                        render={({ field }) => (
                          <FormItem className="flex flex-col justify-end">
                            <FormControl>
                              <Input
                                placeholder="Nro. Referencia"
                                {...field}
                                disabled={isFormDisabled}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg font-bold"
                disabled={isFormDisabled}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    Confirmar Carga
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}

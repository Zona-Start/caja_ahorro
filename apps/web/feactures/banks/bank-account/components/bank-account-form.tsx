'use client';

import { useAccountingAccounts } from '@/feactures/accounting/accounting-accounts/hooks/use-query-account-plan';
import { useAccountingRules } from '@/feactures/accounting/accounting-rules/hooks/use-query-accounting-rules';
import { useBanksQuery } from '@/feactures/banks/bank-directory/hooks/use-banks-querys';
import { useSystemConfigStore } from '@/store/SystemConfigStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import { CustomCalendar } from '@repo/shadcn/custom-calendar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/shadcn/form';
import { Input } from '@repo/shadcn/input';
import { Label } from '@repo/shadcn/label';
import { RadioGroup, RadioGroupItem } from '@repo/shadcn/radio-group';
import { ScrollArea } from '@repo/shadcn/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { SelectSearchable } from '@repo/shadcn/select-searchable';
import { Switch } from '@repo/shadcn/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/tooltip';
import { Info } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useBankAccountMutation } from '../hooks/use-mutation-bank-account';
import { ACCOUNT_TYPES } from '../schemas/bank-account-options';
import { BankAccount, bankAccountSchema } from '../schemas/bank-account.schema';

interface BankAccountFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<BankAccount>;
  readOnly?: boolean;
}

export function BankAccountForm({
  onSuccess,
  onCancel,
  defaultValues,
  readOnly = false,
}: BankAccountFormProps) {
  const { mutate: saveBankAccount, isPending: isSaving } =
    useBankAccountMutation();
  const { data: Banks } = useBanksQuery();
  const { currencies } = useSystemConfigStore();
  const { data: AccoutingAccountsPlans } = useAccountingAccounts();
  const { data: accountingRules } = useAccountingRules(1); // Default companyId 1

  const [selectedAccountType, setSelectedAccountType] = useState(
    defaultValues?.accountType || 'CORRIENTE',
  );
  const [showInitialBalances, setShowInitialBalances] = useState(
    !!defaultValues?.currentBalance,
  );
  const [openingEntryOption, setOpeningEntryOption] = useState(
    defaultValues?.openingEntryPosted ? 'generate' : 'reference',
  );

  const form = useForm<BankAccount>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      ...defaultValues,
      id: defaultValues?.id,
      companyId: defaultValues?.companyId || 1,
      accountNumber: defaultValues?.accountNumber || '',
      accountName: defaultValues?.accountName || '',
      accountType: defaultValues?.accountType || 'CORRIENTE',
      currencyCode: defaultValues?.currencyCode || '1',
      openingDate: defaultValues?.openingDate
        ? new Date(defaultValues.openingDate)
        : undefined,
      currentBalance: Number(defaultValues?.currentBalance) || 0.0,
      linkedChartAccountId: defaultValues?.linkedChartAccountId,
      isActive: defaultValues?.isActive ?? true,
      openingEntryPosted: defaultValues?.openingEntryPosted || false,
    },
    mode: 'onChange',
  });

  const currentBalance = form.watch('currentBalance') || 0;

  const isEditMode = !!defaultValues?.id;
  const openingEntryPosted = form.watch('openingEntryPosted');

  const onSubmit = async (data: BankAccount) => {
    const dataToSave = {
      ...data,
      currentBalance: showInitialBalances ? data.currentBalance : 0,
      openingDate: showInitialBalances ? data.openingDate : null,
      openingEntryPosted:
        showInitialBalances && openingEntryOption === 'generate',
      accountingRuleId:
        showInitialBalances && openingEntryOption === 'generate'
          ? data.accountingRuleId
          : null,
    };

    saveBankAccount(dataToSave, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
      onError: () => {
        form.setError('root', {
          type: 'manual',
          message: 'Error al guardar la cuenta bancaria',
        });
      },
    });
  };

  return (
    <Form {...form}>
      <ScrollArea className="h-[calc(100vh-200px)]">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 p-4 h-full"
        >
          {form.formState.errors.root && (
            <div className="text-destructive text-sm">
              {form.formState.errors.root.message}
            </div>
          )}

          <div className="border p-4 rounded-md">
            <h3 className="text-lg font-semibold mb-4">
              Datos básicos de la cuenta
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bankDirectoryId"
                render={({ field }) => (
                  <FormItem className="w-full md:col-span-2">
                    <FormLabel>Banco</FormLabel>
                    <SelectSearchable
                      options={
                        Banks?.data?.map((item) => ({
                          value: item.id!.toString(),
                          label: `${item.code} - ${item.name}`,
                        })) || []
                      }
                      onValueChange={(value) => field.onChange(Number(value))}
                      placeholder="Selecciona un banco"
                      defaultValue={String(field.value)}
                      disabled={readOnly}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de cuenta</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={readOnly}
                        className={readOnly ? 'bg-muted' : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Cuenta</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={readOnly}
                        className={readOnly ? 'bg-muted' : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Tipo Cuenta</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        setSelectedAccountType(value);
                        field.onChange(value);
                      }}
                      value={selectedAccountType}
                      disabled={readOnly}
                    >
                      <SelectTrigger
                        className={readOnly ? 'bg-muted w-full' : 'w-full'}
                      >
                        <SelectValue placeholder="Seleccione un tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ACCOUNT_TYPES).map(([value, label]) => (
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

              <FormField
                control={form.control}
                name="currencyCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moneda</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value)}
                      value={String(field.value)}
                      disabled={readOnly}
                    >
                      <SelectTrigger
                        className={readOnly ? 'bg-muted w-full' : 'w-full'}
                      >
                        <SelectValue placeholder="Seleccione una moneda" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem
                            key={currency.id}
                            value={currency.id.toString()}
                          >
                            {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="border p-4 rounded-md">
            <h3 className="text-lg font-semibold mb-4">Información contable</h3>
            <FormField
              control={form.control}
              name="linkedChartAccountId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Cuenta Contable</FormLabel>
                  <SelectSearchable
                    options={
                      AccoutingAccountsPlans?.data?.map((account) => ({
                        value: account.id!.toString(),
                        label: `${account.code} - ${account.name}`,
                      })) || []
                    }
                    onValueChange={(value) =>
                      field.onChange(value === 'null' ? null : Number(value))
                    }
                    placeholder="Selecciona cuenta contable"
                    defaultValue={field.value?.toString() || 'null'}
                    disabled={readOnly || (isEditMode && openingEntryPosted)}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="border p-4 rounded-md space-y-4">
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg">
                  <div className="space-y-0.5">
                    <FormLabel>¿Desea registrar saldos iniciales?</FormLabel>
                    <FormDescription>
                      Si se activa, podrá registrar los saldos iniciales de la
                      cuenta.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={showInitialBalances}
                      onCheckedChange={setShowInitialBalances}
                      disabled={readOnly || (isEditMode && openingEntryPosted)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {showInitialBalances && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="openingDate"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Fecha Apertura / Saldo</FormLabel>
                        <FormControl>
                          <CustomCalendar
                            value={field.value}
                            onChange={(date) => field.onChange(date)}
                            onBlur={field.onBlur}
                            placeholder="Seleccione la fecha"
                            disabled={
                              readOnly || (isEditMode && openingEntryPosted)
                            }
                            className={
                              readOnly || (isEditMode && openingEntryPosted)
                                ? 'bg-muted'
                                : ''
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currentBalance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          Saldo según libros
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 ml-2 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  Saldo registrado en contabilidad interna de la
                                  caja de ahorro.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                            disabled={
                              readOnly || (isEditMode && openingEntryPosted)
                            }
                            className={
                              readOnly || (isEditMode && openingEntryPosted)
                                ? 'bg-muted'
                                : ''
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* <FormField
                    control={form.control}
                    name="lastStatementBalance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          Saldo último extracto bancario
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 ml-2 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  Saldo final del último estado de cuenta
                                  recibido del banco.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                            disabled={readOnly || (isEditMode && openingConciliationPosted)}
                            className={(readOnly || (isEditMode && openingConciliationPosted)) ? 'bg-muted' : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastStatementDate"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Fecha Último Extracto bancario</FormLabel>
                        <FormControl>
                          <CustomCalendar
                            value={field.value}
                            onChange={(date) => field.onChange(date)}
                            onBlur={field.onBlur}
                            placeholder="Seleccione la fecha"
                            disabled={readOnly || (isEditMode && openingConciliationPosted)}
                            className={(readOnly || (isEditMode && openingConciliationPosted)) ? 'bg-muted' : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormItem>
                    <FormLabel>Diferencia</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={difference.toFixed(2)}
                        disabled
                        className="bg-muted"
                      />
                    </FormControl>
                  </FormItem> */}
                </div>

                {isEditMode && openingEntryPosted ? (
                  <div className="mt-4 border p-4 rounded-md bg-muted/40">
                    <h4 className="font-semibold mb-2">
                      Asiento de Apertura Creado
                    </h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>
                        Esta cuenta ya tiene un asiento de apertura registrado.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 space-y-4">
                    <RadioGroup
                      value={openingEntryOption}
                      onValueChange={setOpeningEntryOption}
                      disabled={readOnly}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="generate" id="r2" />
                        <Label htmlFor="r2">Generar asiento de apertura</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="reference" id="r3" />
                        <Label htmlFor="r3">Grabar sólo referencia</Label>
                      </div>
                    </RadioGroup>

                    {openingEntryOption === 'generate' && (
                      <FormField
                        control={form.control}
                        name="accountingRuleId"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel>Regla Contable *</FormLabel>
                            <SelectSearchable
                              options={
                                (accountingRules || [])
                                  .filter(
                                    (rule: any) =>
                                      rule.category === 'BANKING' &&
                                      rule.operationType ===
                                        'BANK_INITIAL_BALANCE',
                                  )
                                  .map((rule: any) => {
                                    const detail = rule.details?.find(
                                      (d: any) =>
                                        d.accountRole ===
                                        'INITIAL_BALANCE_CAPITAL',
                                    );
                                    const accountName =
                                      AccoutingAccountsPlans?.data?.find(
                                        (acc) =>
                                          acc.id === detail?.accountPlanId,
                                      )?.name || 'Sin cuenta';
                                    return {
                                      value: rule.id!.toString(),
                                      label: `${rule.description} (${accountName})`,
                                    };
                                  }) || []
                              }
                              onValueChange={(value) =>
                                field.onChange(Number(value))
                              }
                              placeholder="Selecciona regla contable"
                              defaultValue={field.value?.toString() || ''}
                              disabled={readOnly}
                            />
                            <FormDescription>
                              Seleccione la regla que define la cuenta de
                              contrapartida.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="sticky bottom-0 w-full bg-background py-4 mt-auto">
            <div className="flex justify-end gap-4">
              <Button variant="outline" type="button" onClick={onCancel}>
                {readOnly ? 'Cerrar' : 'Cancelar'}
              </Button>
              {!readOnly && (
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </ScrollArea>
    </Form>
  );
}

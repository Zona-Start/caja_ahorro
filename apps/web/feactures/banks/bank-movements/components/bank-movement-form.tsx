'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
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
import { SelectSearchable } from '@repo/shadcn/select-searchable';
import { useForm, useWatch } from 'react-hook-form';

import { Textarea } from '@repo/shadcn/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { useEffect, useState } from 'react';
import { useBankAccountAll } from '../../bank-account/hooks/use-query-bank-account';

import { Search } from 'lucide-react';
import { useCreateBankMovement } from '../hooks/use-create-bank-movement';

import {
  BANK_TRANSACTION_CATEGORY,
  PAYMENT_METHOD,
} from '../schemas/bank-movement-options';
import {
  BankMovement,
  bankMovementSchema,
} from '../schemas/bank-movement.schema';
import { useLinkableStore } from '../store/use-linkable-store';
import { LinkableItemsSearchModal } from './linkable-items-search-modal';
import { SelectedLinkableItemsTable } from './selected-linkable-items-table';

interface BankMovementFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<BankMovement>;
}

export function BankMovementForm({
  onSuccess,
  onCancel,
  defaultValues,
}: BankMovementFormProps) {
  const { mutate: saveBankMovement, isPending: isSaving } =
    useCreateBankMovement();
  const { data: bankAccounts } = useBankAccountAll();
  const [wantsToLink, setWantsToLink] = useState(false);
  const [isSearchModalOpen, setSearchModalOpen] = useState(false);

  const { selectedItems, totalAmount, clearItems } = useLinkableStore();

  const form = useForm<BankMovement>({
    resolver: zodResolver(bankMovementSchema),
    defaultValues: defaultValues,
    mode: 'onChange',
  });

  const category = useWatch({ control: form.control, name: 'category' });
  const date = useWatch({ control: form.control, name: 'transactionDate' });

  useEffect(() => {
    if (!wantsToLink) {
      clearItems();
    }
  }, [wantsToLink, clearItems]);

  useEffect(() => {
    // Sync store with form state
    const linksPayload = selectedItems.map((item) => ({
      internalRecordType: item.type,
      internalRecordId: item.id,
    }));
    form.setValue('links', linksPayload);
    form.setValue('amount', totalAmount, { shouldValidate: true });
  }, [selectedItems, totalAmount, form]);

  const onSubmit = (data: BankMovement) => {
    const payload: any = {
      ...data,
      bankReference: data.bankReference,
      creditAmount: data.movementType === 'ENTRY' ? data.amount : 0,
      debitAmount: data.movementType === 'EXIT' ? data.amount : 0,
    };

    delete payload.movementType;
    delete payload.amount;

    saveBankMovement(payload, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
      onError: (error: any) => {
        form.setError('root', {
          type: 'manual',
          message: error.message || 'Error al guardar el movimiento',
        });
      },
    });
  };

  return (
    <>
      <LinkableItemsSearchModal
        open={isSearchModalOpen}
        onOpenChange={setSearchModalOpen}
        category={category!}
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {form.formState.errors.root && (
            <p className="text-sm text-destructive">
              {form.formState.errors.root.message}
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="bankAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuenta Bancaria</FormLabel>
                  <SelectSearchable
                    options={
                      bankAccounts?.data?.map((acc) => ({
                        value: acc.id!.toString(),
                        label: `${acc.accountName} - ${acc.accountNumber}`,
                      })) || []
                    }
                    onValueChange={(value) => field.onChange(Number(value))}
                    placeholder="Seleccione una cuenta"
                    defaultValue={field.value?.toString()}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="transactionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha</FormLabel>
                  <FormControl>
                    <CustomCalendar
                      value={field.value || null}
                      onChange={field.onChange}
                      placeholder="Seleccione una fecha"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="movementType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Movimiento</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccione un tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ENTRY">Entrada</SelectItem>
                      <SelectItem value="EXIT">Salida</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      if (wantsToLink) {
                        setWantsToLink(false);
                        form.resetField('links');
                        form.resetField('amount');
                      }
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccione una categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(BANK_TRANSACTION_CATEGORY).map(
                        ([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormItem>
              <FormLabel>¿Desea vincular a un registro del sistema?</FormLabel>
              <Select
                onValueChange={(value) => {
                  setWantsToLink(value === 'true');
                }}
                value={wantsToLink ? 'true' : 'false'}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccione una opción" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="false">No</SelectItem>
                  <SelectItem value="true">Sí</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>

            {wantsToLink && (
              <FormItem>
                <FormLabel>Operaciones dentro del sistema</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  onClick={() => setSearchModalOpen(true)}
                  disabled={!category || !date}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Buscar y seleccionar operaciones...
                </Button>
                {(!category || !date) && (
                  <p className="text-sm text-muted-foreground">
                    Seleccione una categoría y una fecha para buscar.
                  </p>
                )}
              </FormItem>
            )}
          </div>

          {wantsToLink && (
            <div className="col-span-2">
              <SelectedLinkableItemsTable />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Transacción</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccione un tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(PAYMENT_METHOD).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value}
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
              name="bankReference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referencia Bancaria</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Referencia"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                      disabled={selectedItems.length > 0}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descripción del movimiento"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-4 pr-4">
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar Movimiento'}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}

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

import { Checkbox } from '@repo/shadcn/components/ui/checkbox';
import { Textarea } from '@repo/shadcn/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { useState } from 'react';
import { useBankAccountAll } from '../../bank-account/hooks/use-query-bank-account';
import { useBankMovementMutation } from '../hooks/use-mutation-bank-movement';
import {
  BANK_TRANSACTION_CATEGORY,
  PAYMENT_METHOD,
} from '../schemas/bank-movement-options';
import {
  BankMovement,
  bankMovementSchema,
} from '../schemas/bank-movement.schema';
import { LinkableRecordTable } from './linkable-record-table';

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
    useBankMovementMutation();
  const { data: bankAccounts } = useBankAccountAll();
  const [showLinkTable, setShowLinkTable] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const form = useForm<BankMovement>({
    resolver: zodResolver(bankMovementSchema),
    defaultValues: defaultValues,
    mode: 'onChange',
  });

  const category = useWatch({ control: form.control, name: 'category' });

  const onSubmit = (data: BankMovement) => {
    const payload: any = {
      ...data,
      creditAmount: data.movementType === 'ENTRY' ? data.amount : 0,
      debitAmount: data.movementType === 'EXIT' ? data.amount : 0,
    };

    if (selectedRecord) {
      payload.linkTo = {
        internalRecordId: selectedRecord.id,
        internalRecordType: category, // Assuming category maps to the record type
      };
    }

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

  const handleRecordSelect = (record: any) => {
    setSelectedRecord(record);
    // Optionally, you can update a form field to store the linked record ID
    // form.setValue('linkedRecordId', record.id);
    alert(`Registro seleccionado: ${record.description}`);
  };

  return (
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
                  onValueChange={field.onChange}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="transactionType"
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
                  <Input placeholder="Referencia" {...field} />
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
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
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

        <div className="items-top flex space-x-2 mt-8">
          <Checkbox
            id="link-checkbox"
            onCheckedChange={(checked) => setShowLinkTable(!!checked)}
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="link-checkbox"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              ¿Desea vincular a un registro del sistema?
            </label>
          </div>
        </div>

        {showLinkTable && (
          <LinkableRecordTable
            category={category}
            onRecordSelect={handleRecordSelect}
          />
        )}

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
  );
}

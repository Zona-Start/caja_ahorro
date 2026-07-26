import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
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
import { Textarea } from '@repo/shadcn/textarea';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAddManualMovementMutation } from '../hooks/use-bank-reconciliation-query';
import {
  CATEGORY_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  MOVEMENT_TYPE_OPTIONS,
} from '../schemas/bank-reconciliation-options';
import { bankMovementManualSchema } from '../schemas/bank-reconciliation.schema';
import type { BankMovementManualForm } from '../schemas/bank-reconciliation.schema';

const formSchema = bankMovementManualSchema.extend({
  movementType: z.enum(['CREDIT', 'DEBIT']).default('CREDIT'),
  amount: z.coerce.number().min(0).optional(),
});

type FormFields = z.infer<typeof formSchema>;

interface BankReconciliationMovementFormProps {
  reconciliationId: string;
  bankAccountId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
}

const CATEGORY_LIST = Object.entries(CATEGORY_OPTIONS).map(([v, l]) => ({
  value: v,
  label: l,
}));

const PAYMENT_LIST = Object.entries(PAYMENT_METHOD_OPTIONS).map(([v, l]) => ({
  value: v,
  label: l,
}));

export function BankReconciliationMovementForm({
  reconciliationId,
  bankAccountId,
  onSuccess,
  onCancel,
  disabled = false,
}: BankReconciliationMovementFormProps) {
  const addMutation = useAddManualMovementMutation();

  const form = useForm<FormFields>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bankAccountId,
      transactionDate: new Date(),
      description: '',
      category: '',
      paymentMethod: 'BANK_TRANSFER',
      movementType: 'CREDIT',
      amount: 0,
      bankReference: '',
    },
    mode: 'onSubmit',
  });

  const onSubmit = (data: FormFields) => {
    const payload: BankMovementManualForm = {
      bankAccountId,
      transactionDate: data.transactionDate,
      valueDate: data.valueDate,
      description: data.description,
      category: data.category,
      bankReference: data.bankReference || null,
      paymentMethod: data.paymentMethod,
      debitAmount: data.movementType === 'DEBIT' ? (data.amount || 0) : 0,
      creditAmount: data.movementType === 'CREDIT' ? (data.amount || 0) : 0,
      resultingBalance: data.resultingBalance,
      note: data.note || null,
    };

    addMutation.mutate(
      { reconciliationId, payload },
      {
        onSuccess: () => {
          form.reset();
          onSuccess?.();
        },
      },
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="transactionDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Transacción</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={
                      field.value instanceof Date
                        ? field.value.toISOString().split('T')[0]
                        : field.value || ''
                    }
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? new Date(e.target.value) : undefined,
                      )
                    }
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="valueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha Valor</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={
                      field.value instanceof Date
                        ? field.value.toISOString().split('T')[0]
                        : field.value || ''
                    }
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? new Date(e.target.value) : undefined,
                      )
                    }
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Pago de proveedor"
                  {...field}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ''}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona categoría" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORY_LIST.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
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
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Método de Pago</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ''}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona método" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PAYMENT_LIST.map((pm) => (
                      <SelectItem key={pm.value} value={pm.value}>
                        {pm.label}
                      </SelectItem>
                    ))}
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
            name="movementType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="CREDIT">Crédito (Entrada)</SelectItem>
                    <SelectItem value="DEBIT">Débito (Salida)</SelectItem>
                  </SelectContent>
                </Select>
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
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseFloat(e.target.value) : undefined,
                      )
                    }
                    disabled={disabled}
                  />
                </FormControl>
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
                    placeholder="Ej: REF-001"
                    {...field}
                    value={field.value ?? ''}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nota</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Nota adicional..."
                  {...field}
                  value={field.value ?? ''}
                  disabled={disabled}
                  rows={2}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={addMutation.isPending || disabled}>
            {addMutation.isPending ? 'Agregando...' : 'Agregar Movimiento'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

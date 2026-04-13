'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@repo/shadcn/modal';
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
import { useDisburseSettlementMutation } from '../../hooks/use-settlement-mutation';
import { useBankAccountAll } from '@/feactures/banks/bank-account/hooks/use-query-bank-account';
import { 
  disburseSettlementSchema, 
  DisburseSettlementFormData 
} from '../../schemas/disburse-settlement.schema';
import { SettlementPaymentApi } from '../../schemas/settlement-api-response';
import { format } from 'date-fns';

interface DisburseSettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SettlementPaymentApi;
}

export const DisburseSettlementModal: React.FC<DisburseSettlementModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const { data: bankAccountsResponse, isLoading: isLoadingBanks } = useBankAccountAll();
  const { mutate: disburse, isPending: isDisbursing } = useDisburseSettlementMutation();

  // Handle potential nested data structure from useBankAccountAll
  const bankAccounts = bankAccountsResponse?.data || [];

  const form = useForm<DisburseSettlementFormData>({
    resolver: zodResolver(disburseSettlementSchema),
    defaultValues: {
      bankAccountId: 0,
      bankReference: '',
      transferDate: new Date(),
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const onSubmit = async (formData: DisburseSettlementFormData) => {
    disburse(
      { id: Number(data.id), formData },
      {
        onSuccess: () => {
          onClose();
          form.reset();
        },
      }
    );
  };

  return (
    <Modal
      title="Procesar Desembolso de Liquidación"
      description={`Registrar el pago para: ${data.associateFullname} (Ref: ${data.customReference}) por un monto de ${data.netLiquidationAmount} VES`}
      isOpen={isOpen}
      onClose={onClose}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full">
          <FormField
            control={form.control}
            name="bankAccountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cuenta Bancaria Origen</FormLabel>
                <Select
                  disabled={isDisbursing || isLoadingBanks}
                  onValueChange={(val) => field.onChange(Number(val))}
                  value={field.value !== 0 ? field.value?.toString() : undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder="Seleccione una cuenta bancaria"
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {bankAccounts?.map((account: any) => (
                      <SelectItem key={account.id} value={account.id.toString()}>
                        {account.accountNumber} - {account.accountName}
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
                    disabled={isDisbursing}
                    placeholder="Número de referencia de transferencia"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="transferDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Transferencia</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    disabled={isDisbursing}
                    value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex w-full items-center justify-end space-x-2 pt-6">
            <Button
              disabled={isDisbursing}
              variant="outline"
              type="button"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button disabled={isDisbursing} type="submit">
              Confirmar Desembolso
            </Button>
          </div>
        </form>
      </Form>
    </Modal>
  );
};

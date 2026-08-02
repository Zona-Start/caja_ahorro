'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@repo/shadcn/button';
import { Input } from '@repo/shadcn/input';
import { Separator } from '@repo/shadcn/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/shadcn/form';
import { CustomCalendar } from '@repo/shadcn/components/ui/custom-calendar';
import { AlertModal } from '@/components/shared/alert-modal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { useToastSystem } from '@/hooks/use-toast-system';
import { useBankAccountAllQuery } from '@/features/banks/bank-account/hooks/use-bank-account-query';
import { useDisburseSettlementMutation } from '../hooks/use-settlement-query';
import { type SettlementPaymentApi } from '../schemas/settlement-api-response';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: SettlementPaymentApi | null;
}

const disburseSchema = z.object({
  bankAccountId: z.string().min(1, 'Seleccione una cuenta bancaria'),
  transferDate: z.coerce.date(),
  bankReference: z.string().optional(),
});

type DisburseForm = z.infer<typeof disburseSchema>;

export function SettlementDesembolsarModal({
  open,
  onOpenChange,
  data,
}: Props) {
  const toast = useToastSystem();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: bankAccounts } = useBankAccountAllQuery();
  const { mutate: disburse, isPending: saving } =
    useDisburseSettlementMutation();

  const form = useForm<DisburseForm>({
    resolver: zodResolver(disburseSchema),
    defaultValues: {
      bankAccountId: '',
      transferDate: new Date(),
      bankReference: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        bankAccountId: '',
        transferDate: new Date(),
        bankReference: '',
      });
    }
  }, [open, form]);

  if (!data) return null;

  const disbursedAmount = Number(data.netLiquidationAmount ?? 0);

  const handleSubmit = form.handleSubmit(() => {
    setConfirmOpen(true);
  });

  const handleConfirm = () => {
    const formData = form.getValues();
    disburse(
      {
        id: data.id,
        formData: {
          bankAccountId: formData.bankAccountId,
          transferDate: formData.transferDate,
          bankReference: formData.bankReference || '',
        },
      },
      {
        onSuccess: () => {
          toast.success({
            title: 'Desembolso exitoso',
            description: 'Se registró el desembolso exitosamente',
          });
          onOpenChange(false);
        },
        onError: (err: unknown) => {
          toast.error({
            title: 'Error',
            description:
              (err as any)?.response?.data?.message ??
              (err as Error)?.message ??
              'No se pudo desembolsar',
          });
        },
      },
    );
    setConfirmOpen(false);
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" /> Desembolsar Liquidación
          </DialogTitle>
          <DialogDescription>
            Desembolsar liquidación
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="rounded-lg border p-4 bg-muted/30">
            <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-3">
              Datos de la Liquidación
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Asociado:
                </span>
                <span className="text-sm font-bold">
                  {data.associateFullname || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Referencia:
                </span>
                <span className="text-sm font-mono">
                  {data.customReference || '—'}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-end">
                <span className="text-sm text-muted-foreground">
                  Monto a Desembolsar:
                </span>
                <span className="text-lg font-black text-primary">
                  {Number(disbursedAmount).toLocaleString('es', {
                    minimumFractionDigits: 2,
                  })}{' '}
                  Bs
                </span>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form
              onSubmit={handleSubmit}
              className="space-y-4 border-t pt-4"
            >
              <FormField
                control={form.control}
                name="bankAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase font-bold text-muted-foreground">
                      Cuenta Bancaria
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                      disabled={saving}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione cuenta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(bankAccounts?.data ?? [])
                          .filter((b: any) => b.isActive !== false)
                          .map((b: any) => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.accountName} - {b.accountNumber}
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
                name="transferDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha *</FormLabel>
                    <FormControl>
                      <CustomCalendar
                        value={field.value}
                        onChange={field.onChange}
                        disabled={saving}
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
                        placeholder="Nº de referencia..."
                        {...field}
                        disabled={saving}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-xs text-muted-foreground">
                    Total a Desembolsar
                  </span>
                  <p className="text-xl font-black text-primary">
                    {Number(disbursedAmount).toLocaleString('es', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    Bs
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClose}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />{' '}
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Send className="mr-1 h-4 w-4" /> Desembolsar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>

        <AlertModal
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleConfirm}
          loading={saving}
          title="Confirmar Desembolso"
          description={`¿Está seguro de desembolsar ${Number(disbursedAmount).toLocaleString('es', { minimumFractionDigits: 2 })} Bs a ${data.associateFullname || 'el asociado'}?`}
        />
      </DialogContent>
    </Dialog>
  );
}

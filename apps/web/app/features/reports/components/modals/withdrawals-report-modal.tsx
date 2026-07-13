import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowUpFromLine, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Button } from '@repo/shadcn/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/shadcn/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { Input } from '@repo/shadcn/input';
import { Label } from '@repo/shadcn/label';
import { RadioGroup, RadioGroupItem } from '@repo/shadcn/radio-group';
import { apiClient } from '@/lib/api-client';
import { useExportWithdrawalsPdfMutation } from '../../hooks/use-reports-mutations';
import {
  withdrawalReportFilterSchema,
  type WithdrawalReportFilters,
} from '../../schemas/reports.schema';

interface WithdrawalsReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WithdrawalsReportModal({ isOpen, onClose }: WithdrawalsReportModalProps) {
  const [withdrawalTypes, setWithdrawalTypes] = useState<
    { id: string; description: string }[]
  >([]);

  const mutation = useExportWithdrawalsPdfMutation();

  const form = useForm<WithdrawalReportFilters>({
    resolver: zodResolver(withdrawalReportFilterSchema),
    defaultValues: {
      cedula: '',
      withdrawalTypeId: '',
      reference: '',
      dateFrom: '',
      dateTo: '',
      format: 'pdf',
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    const fetchWithdrawalTypes = async () => {
      try {
        const res = await apiClient.get(
          '/savings-banks/withdrawal-types',
        );
        const types = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        setWithdrawalTypes(types);
      } catch {
        // Silently fail
      }
    };
    fetchWithdrawalTypes();
  }, [isOpen]);

  const onSubmit = (values: WithdrawalReportFilters) => {
    const cleanValues: Record<string, string | undefined> = {};
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== 'all') {
        cleanValues[k] = v as string;
      }
    });
    mutation.mutate(cleanValues, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpFromLine className="h-5 w-5" />
            Retiros de Haberes
          </DialogTitle>
          <DialogDescription>
            Seleccione los filtros para generar el reporte de retiros de haberes.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cedula"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cédula del Asociado</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: 12345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="withdrawalTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Retiro</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {withdrawalTypes.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referencia del Retiro</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: RET-123456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dateFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Desde</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Hasta</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Formato de descarga</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex gap-4"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="pdf" id="withdrawals-pdf" />
                        <Label htmlFor="withdrawals-pdf">PDF</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="excel" id="withdrawals-excel" />
                        <Label htmlFor="withdrawals-excel">Excel</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Generar Reporte
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

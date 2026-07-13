import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ListChecks, Loader2 } from 'lucide-react';
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
import { Input } from '@repo/shadcn/input';
import { Label } from '@repo/shadcn/label';
import { RadioGroup, RadioGroupItem } from '@repo/shadcn/radio-group';
import { useExportCreditQuotasPdfMutation } from '../../hooks/use-reports-mutations';
import {
  creditQuotaReportFilterSchema,
  type CreditQuotaReportFilters,
} from '../../schemas/reports.schema';

interface CreditQuotasReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreditQuotasReportModal({ isOpen, onClose }: CreditQuotasReportModalProps) {
  const mutation = useExportCreditQuotasPdfMutation();

  const form = useForm<CreditQuotaReportFilters>({
    resolver: zodResolver(creditQuotaReportFilterSchema),
    defaultValues: {
      dateFrom: '',
      dateTo: '',
      reference: '',
      cedula: '',
      format: 'pdf',
    },
  });

  const onSubmit = (values: CreditQuotaReportFilters) => {
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
            <ListChecks className="h-5 w-5" />
            Cuotas de Créditos
          </DialogTitle>
          <DialogDescription>
            Seleccione los filtros para generar el reporte de cuotas de créditos.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referencia del Crédito</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: CRED-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                        <RadioGroupItem value="pdf" id="credit-quotas-pdf" />
                        <Label htmlFor="credit-quotas-pdf">PDF</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="excel" id="credit-quotas-excel" />
                        <Label htmlFor="credit-quotas-excel">Excel</Label>
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

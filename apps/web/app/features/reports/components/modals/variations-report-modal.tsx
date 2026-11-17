import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BarChart3, Loader2 } from 'lucide-react';
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
import { Label } from '@repo/shadcn/label';
import { RadioGroup, RadioGroupItem } from '@repo/shadcn/radio-group';
import {
  useExportVariationsExcelMutation,
  useExportVariationsPdfMutation,
} from '../../hooks/use-reports-mutations';
import {
  variationReportFilterSchema,
  type VariationReportFilters,
} from '../../schemas/reports.schema';

interface VariationsReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VariationsReportModal({ isOpen, onClose }: VariationsReportModalProps) {
  const pdfMutation = useExportVariationsPdfMutation();
  const excelMutation = useExportVariationsExcelMutation();
  const isPending = pdfMutation.isPending || excelMutation.isPending;

  const form = useForm<VariationReportFilters>({
    resolver: zodResolver(variationReportFilterSchema),
    defaultValues: {
      format: 'pdf',
    },
  });

  const onSubmit = (values: VariationReportFilters) => {
    const cleanValues: Record<string, string | undefined> = {};
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== 'all') {
        cleanValues[k] = v as string;
      }
    });
    const mutation =
      values.format === 'excel' ? excelMutation : pdfMutation;
    mutation.mutate(cleanValues, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Variaciones
          </DialogTitle>
          <DialogDescription>
            Genere el reporte consolidado de variaciones de préstamos y
            créditos. Incluye solo operaciones en bolívares (VES) y no requiere
            rango de fechas.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        <RadioGroupItem value="pdf" id="variations-pdf" />
                        <Label htmlFor="variations-pdf">PDF</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="excel" id="variations-excel" />
                        <Label htmlFor="variations-excel">Excel</Label>
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
              <Button type="submit" disabled={isPending}>
                {isPending && (
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

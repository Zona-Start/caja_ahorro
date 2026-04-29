'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import { CustomCalendar } from '@repo/shadcn/custom-calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/shadcn/form';
import { useForm } from 'react-hook-form';
import { useReportDebtMutation } from '../hooks/use-reports-mutation';
import { ReportDebtSchema, ReportDebtValues } from '../schemas/reports.schema';

interface ReportDebtModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportDebtModal({ open, onOpenChange }: ReportDebtModalProps) {
  const { mutate: generateReport, isPending } = useReportDebtMutation();

  const form = useForm<ReportDebtValues>({
    resolver: zodResolver(ReportDebtSchema),
    defaultValues: {
      startDate: new Date(),
      endDate: new Date(),
    },
  });

  const onSubmit = (data: ReportDebtValues) => {
    generateReport(data, {
      onSuccess: () => {
        onOpenChange(false);
        form.reset();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generar Reporte de Deudas</DialogTitle>
          <DialogDescription>
            Seleccione el rango de fechas para generar el reporte.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Inicio</FormLabel>
                  <FormControl>
                    <CustomCalendar
                      value={field.value}
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
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Fin</FormLabel>
                  <FormControl>
                    <CustomCalendar
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Seleccione una fecha"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Generando...' : 'Generar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

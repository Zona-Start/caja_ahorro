import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Loader2 } from 'lucide-react';
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
import { useExportAssociatesPdfMutation } from '../../hooks/use-reports-mutations';
import {
  associatesReportFilterSchema,
  type AssociatesReportFilters,
} from '../../schemas/reports.schema';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'INACTIVE', label: 'Inactivo' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'SUSPENDED', label: 'Suspendido' },
  { value: 'LOCKED', label: 'Bloqueado' },
  { value: 'RETIRED', label: 'Retirado' },
  { value: 'ARCHIVED', label: 'Archivado' },
];

const GENDER_OPTIONS = [
  { value: 'FEMENINO', label: 'Femenino' },
  { value: 'MASCULINO', label: 'Masculino' },
  { value: 'OTRO', label: 'Otro' },
];

interface AssociatesReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AssociatesReportModal({ isOpen, onClose }: AssociatesReportModalProps) {
  const [categories, setCategories] = useState<{
    payrollTypes: { id: string; name: string }[];
    workerTypes: { id: string; name: string }[];
  }>({ payrollTypes: [], workerTypes: [] });

  const mutation = useExportAssociatesPdfMutation();

  const form = useForm<AssociatesReportFilters>({
    resolver: zodResolver(associatesReportFilterSchema),
    defaultValues: {
      status: '',
      isPayrollCredit: '',
      gender: '',
      associatedTypeId: '',
      payrollTypeId: '',
      dateFrom: '',
      dateTo: '',
      format: 'pdf',
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    const fetchCategories = async () => {
      try {
        const [payrollRes, workerRes] = await Promise.all([
          apiClient.get('/core/categories', {
            params: { type: 'payroll_type', limit: 50 },
          }),
          apiClient.get('/core/categories', {
            params: { type: 'associate_type', limit: 50 },
          }),
        ]);
        setCategories({
          payrollTypes: payrollRes.data?.data ?? [],
          workerTypes: workerRes.data?.data ?? [],
        });
      } catch {
        // Silently fail
      }
    };
    fetchCategories();
  }, [isOpen]);

  const onSubmit = (values: AssociatesReportFilters) => {
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
            <FileText className="h-5 w-5" />
            Listado de Asociados
          </DialogTitle>
          <DialogDescription>
            Seleccione los filtros para generar el reporte de asociados.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estatus</FormLabel>
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
                        {STATUS_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
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
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Género</FormLabel>
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
                        {GENDER_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
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
              name="isPayrollCredit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credi-Nómina</FormLabel>
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
                      <SelectItem value="true">Sí</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="payrollTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Nómina</FormLabel>
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
                        {categories.payrollTypes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
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
                name="associatedTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Trabajador</FormLabel>
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
                        {categories.workerTypes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dateFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Ingreso Desde</FormLabel>
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
                    <FormLabel>Fecha Ingreso Hasta</FormLabel>
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
                        <RadioGroupItem value="pdf" id="pdf" />
                        <Label htmlFor="pdf">PDF</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="excel" id="excel" />
                        <Label htmlFor="excel">Excel</Label>
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

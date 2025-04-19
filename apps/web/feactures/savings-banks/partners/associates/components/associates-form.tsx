'use client';

import { useBanksQuery } from '@/feactures/banks/bank/hooks/use-banks-querys';
import { useCategoriesTypesGroup } from '@/feactures/common/category-types/hooks/use-querys-category-types';
import { useStatesQuery } from '@/feactures/common/states/hooks/use-querys-states';
import { useTransactionType } from '@/feactures/configurations/transaction-type/hooks/use-query-transaction-type';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import { CustomCalendar } from '@repo/shadcn/custom-calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/shadcn/form';
import { Input } from '@repo/shadcn/input';
import { ScrollArea } from '@repo/shadcn/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { useForm } from 'react-hook-form';
import { useAssociateMutation } from '../hooks/use-associate-mutation';
import {
  AssociateMutationSchema,
  AssociatesMutate,
} from '../schemas/associates.schema';

interface AccountPlanFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<AssociatesMutate>;
  readOnly?: boolean;
}

export function AssociatesForm({
  onSuccess,
  onCancel,
  defaultValues,
  readOnly = false,
}: AccountPlanFormProps) {
  const {
    mutate: saveAssociate,
    isPending: isSaving,
    isError,
  } = useAssociateMutation();

  const { data: StatesQuery } = useStatesQuery();
  const { data: CategoryFrecuentia } =
    useCategoriesTypesGroup('FRECUENCIA_NOMINA');
  const { data: WorkerType } = useCategoriesTypesGroup('TIPO_TRABAJADOR');
  const { data: PayrollType } = useTransactionType();
  const { data: Banks } = useBanksQuery();

  const form = useForm<AssociatesMutate>({
    resolver: zodResolver(AssociateMutationSchema),
    defaultValues: {
      id: defaultValues?.id,
      savingsBankId: defaultValues?.savingsBankId || 1,
      cedula: defaultValues?.cedula || '',
      fullname: defaultValues?.fullname || '',
      nationality: defaultValues?.nationality || 'VENEZOLANO',
      gender: defaultValues?.gender || 'MASCULINO',
      birthdate: defaultValues?.birthdate
        ? new Date(defaultValues.birthdate)
        : new Date(),
      localityId: defaultValues?.localityId,
      phone: defaultValues?.phone || '',
      email: defaultValues?.email || '',
      dateAdmission: defaultValues?.dateAdmission
        ? new Date(defaultValues.dateAdmission)
        : new Date(),
      dateGraduation: defaultValues?.dateGraduation
        ? new Date(defaultValues.dateGraduation)
        : new Date(),
      isPayrollCredit: defaultValues?.isPayrollCredit || 'false',
      discountFrequencyId: defaultValues?.discountFrequencyId,
      payrollTypeId: defaultValues?.payrollTypeId,
      status: defaultValues?.status || 'ACTIVE',
      workerTypeId: defaultValues?.workerTypeId,
      charge: defaultValues?.charge || '',
      bankId: defaultValues?.bankId,
      accountNumber: defaultValues?.accountNumber || '',
      salaryTotal: defaultValues?.salaryTotal || '',
    },
    mode: 'onChange', // Enable real-time validation
  });

  const onSubmit = async (data: AssociatesMutate) => {
    saveAssociate(data, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
      onError: () => {
        form.setError('root', {
          type: 'manual',
          message: 'Error al guardar la cuenta contable',
        });
      },
    });
  };

  return (
    <Form {...form}>
      <ScrollArea className="h-[calc(100vh-200px)]">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4  h-full"
        >
          {form.formState.errors.root && (
            <div className="text-destructive text-sm">
              {form.formState.errors.root.message}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="cedula"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cédula</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={readOnly}
                      className={readOnly ? 'bg-muted' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fullname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre y Apellido</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={readOnly}
                      className={readOnly ? 'bg-muted' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nationality"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Nacionalidad</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={readOnly}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona su nacionalidad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-full min-w-[200px]">
                      <SelectItem value="VENEZOLANO">VENEZOLANO</SelectItem>
                      <SelectItem value="EXTRANJERO">EXTRANJERO</SelectItem>
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
                <FormItem className="w-full">
                  <FormLabel>Género</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={readOnly}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona su género" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-full min-w-[200px]">
                      <SelectItem value="FEMENINO">FEMENINO</SelectItem>
                      <SelectItem value="MASCULINO">MASCULINO</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="birthdate"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Fecha nacimiento</FormLabel>
                  <FormControl>
                    <CustomCalendar
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Seleccione la fecha"
                      disabled={readOnly}
                      className={readOnly ? 'bg-muted' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="localityId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Ubicación</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    defaultValue={String(field.value)}
                    disabled={readOnly}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-full min-w-[200px] max-h-[200px] overflow-y-auto">
                      {StatesQuery?.map((item) => (
                        <SelectItem
                          key={item.id}
                          value={item.id!.toString()}
                          className={readOnly ? 'bg-muted' : ''}
                        >
                          {item.name}
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
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={readOnly}
                      className={readOnly ? 'bg-muted' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      {...field}
                      disabled={readOnly}
                      className={readOnly ? 'bg-muted' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dateAdmission"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Fecha Ingreso</FormLabel>
                  <FormControl>
                    <CustomCalendar
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Seleccione la fecha"
                      disabled={readOnly}
                      className={readOnly ? 'bg-muted' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dateGraduation"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Fecha Egreso</FormLabel>
                  <FormControl>
                    <CustomCalendar
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Seleccione la fecha"
                      disabled={readOnly}
                      className={readOnly ? 'bg-muted' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="discountFrequencyId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Frecuencia Descuento</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    defaultValue={String(field.value)}
                    disabled={readOnly}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un frecuencia" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-full min-w-[200px] max-h-[200px] overflow-y-auto">
                      {CategoryFrecuentia?.data?.map((item: any) => (
                        <SelectItem
                          key={item.id}
                          value={item.id!.toString()}
                          className={readOnly ? 'bg-muted' : ''}
                        >
                          {item.description}
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
              name="isPayrollCredit"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Posee Credi-Nomina</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={String(field.value)}
                    disabled={readOnly}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-full min-w-[200px]">
                      <SelectItem value="true">Si</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Estatus del Socio</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={String(field.value)}
                    disabled={readOnly}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-full min-w-[200px]">
                      <SelectItem value="ACTIVE">Activo</SelectItem>
                      <SelectItem value="INACTIVE">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payrollTypeId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Tipo de Nomina</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    defaultValue={String(field.value)}
                    disabled={readOnly}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-full min-w-[200px] max-h-[200px] overflow-y-auto">
                      {PayrollType?.data?.map((item: any) => (
                        <SelectItem
                          key={item.id}
                          value={item.id!.toString()}
                          className={readOnly ? 'bg-muted' : ''}
                        >
                          {item.code} - {item.description}
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
              name="workerTypeId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Tipo de Trabajador</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    defaultValue={String(field.value)}
                    disabled={readOnly}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-full min-w-[200px] max-h-[200px] overflow-y-auto">
                      {WorkerType?.data?.map((item: any) => (
                        <SelectItem
                          key={item.id}
                          value={item.id!.toString()}
                          className={readOnly ? 'bg-muted' : ''}
                        >
                          {item.description}
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
              name="charge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cargo</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={readOnly}
                      className={readOnly ? 'bg-muted' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="salaryTotal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sueldo</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      {...field}
                      disabled={readOnly}
                      className={readOnly ? 'bg-muted' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de cuenta Bancaria</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={readOnly}
                      className={readOnly ? 'bg-muted' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1  gap-4">
            <FormField
              control={form.control}
              name="bankId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Banco</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    defaultValue={String(field.value)}
                    disabled={readOnly}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona el banco" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-full min-w-[200px] max-h-[200px] overflow-y-auto">
                      {Banks?.data?.map((item: any) => (
                        <SelectItem
                          key={item.id}
                          value={item.id!.toString()}
                          className={readOnly ? 'bg-muted' : ''}
                        >
                          {item.code} - {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="sticky bottom-0 w-full bg-background  py-2 px-6 mt-auto">
            <div className="flex justify-end gap-4">
              <Button variant="outline" type="button" onClick={onCancel}>
                {readOnly ? 'Cerrar' : 'Cancelar'}
              </Button>
              {!readOnly && (
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </ScrollArea>
    </Form>
  );
}

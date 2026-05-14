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
import { SelectSearchable } from '@repo/shadcn/select-searchable';
import { useForm } from 'react-hook-form';
import { useAssociateMutation } from '../hooks/use-associates-query';
import { ESTATUS_TYPES, type EstatusType } from '../schemas/associates-options';
import {
  AssociateMutationSchema,
  type AssociatesMutate,
} from '../schemas/associates.schema';
// Dependencies
import { useBanksQuery } from '@/features/banks/bank-directory/hooks/use-banks-querys';
import { useCategoriesQuery } from '@/features/core/categories/hooks/use-categories-queries';
import { useStatesQuery } from '@/features/core/states/hooks/use-querys-states';

interface AccountPlanFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<AssociatesMutate>;
  readOnly?: boolean;
}

const getStatusOptions = (keys: EstatusType[] = []) =>
  Object.entries(ESTATUS_TYPES)
    .filter(([key]) => keys.length === 0 || keys.includes(key as EstatusType))
    .map(([key, label]) => (
      <SelectItem key={key} value={key}>
        {label}
      </SelectItem>
    ));

export function AssociatesForm({
  onSuccess,
  onCancel,
  defaultValues,
  readOnly = false,
}: AccountPlanFormProps) {
  const { mutate: saveAssociate, isPending: isSaving } = useAssociateMutation();

  const { data: StatesQuery } = useStatesQuery();
  const { data: CategoryFrecuentia } = useCategoriesQuery({
    page: 1,
    limit: 100,
    type: 'discount_frequency',
  });
  const { data: AssociatedType } = useCategoriesQuery({
    page: 1,
    limit: 100,
    type: 'associate_type',
  });
  const { data: PayrollType } = useCategoriesQuery({
    page: 1,
    limit: 100,
    type: 'payroll_type',
  });
  const { data: Banks } = useBanksQuery();

  const form = useForm<AssociatesMutate>({
    resolver: zodResolver(AssociateMutationSchema),
    defaultValues: {
      id: defaultValues?.id,
      tenantId: defaultValues?.tenantId || '',
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
        : null,
      isPayrollCredit: defaultValues?.isPayrollCredit || false,
      discountFrequencyId: defaultValues?.discountFrequencyId,
      payrollTypeId: defaultValues?.payrollTypeId,
      status: defaultValues?.status || 'ACTIVE',
      associatedTypeId: defaultValues?.associatedTypeId,
      jobTitle: defaultValues?.jobTitle || '',
      bankDirectoryId: defaultValues?.bankDirectoryId,
      accountNumber: defaultValues?.accountNumber || '',
      baseSalary: defaultValues?.baseSalary || '',
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: AssociatesMutate) => {
    saveAssociate(data, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
    });
  };

  const statusEdit = getStatusOptions(['ACTIVE', 'INACTIVE', 'SUSPENDED']);
  const statusCreate = getStatusOptions(['ACTIVE']);
  const statusView = defaultValues?.status
    ? getStatusOptions([defaultValues.status as EstatusType])
    : null;

  return (
    <Form {...form}>
      <ScrollArea className="h-[calc(100vh-200px)]">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 h-full"
        >
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
                    value={field.value}
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
                    value={field.value}
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
                      value={field.value || null}
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
                  <SelectSearchable
                    options={
                      StatesQuery?.map((item) => ({
                        value: item.id!.toString(),
                        label: `${item.name}`,
                      })) || []
                    }
                    onValueChange={(value) => field.onChange(Number(value))}
                    placeholder="Selecciona un estado"
                    value={field.value?.toString() ?? ''}
                    disabled={readOnly}
                  />
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
                      value={field.value ?? ''}
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
                      value={field.value ?? ''}
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
                      value={field.value || null}
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
                      value={field.value || null}
                      onChange={(date) => field.onChange(date || null)}
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
                    onValueChange={(value) => field.onChange(value)}
                    value={field.value != null ? field.value : ''}
                    disabled={readOnly}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un frecuencia" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-full min-w-[200px] max-h-[200px] overflow-y-auto">
                      {CategoryFrecuentia?.data?.map((item) => (
                        <SelectItem key={item.id} value={item.id!}>
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
              name="isPayrollCredit"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Posee Credi-Nomina</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === 'true')}
                    value={field.value != null ? String(field.value) : ''}
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
                    value={field.value}
                    disabled={readOnly}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-full min-w-[200px]">
                      {readOnly
                        ? statusView
                        : defaultValues
                          ? statusEdit
                          : statusCreate}
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
                    onValueChange={(value) => field.onChange(value)}
                    value={field.value != null ? field.value : ''}
                    disabled={readOnly}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-full min-w-[200px] max-h-[200px] overflow-y-auto">
                      {PayrollType?.data?.map((item) => (
                        <SelectItem key={item.id} value={item.id!}>
                          {item.code} - {item.name}
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
                <FormItem className="w-full">
                  <FormLabel>Tipo de Trabajador</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value)}
                    value={field.value != null ? field.value : ''}
                    disabled={readOnly}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-full min-w-[200px] max-h-[200px] overflow-y-auto">
                      {AssociatedType?.data?.map((item) => (
                        <SelectItem key={item.id} value={item.id!}>
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
              name="jobTitle"
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
              name="baseSalary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sueldo</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
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
          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="bankDirectoryId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Banco</FormLabel>
                  <SelectSearchable
                    options={
                      Banks?.data?.map((item) => ({
                        value: item.id!,
                        label: `${item.code} - ${item.name}`,
                      })) || []
                    }
                    onValueChange={(value) => field.onChange(value)}
                    placeholder="Selecciona un banco"
                    value={field.value != null ? field.value : ''}
                    disabled={readOnly}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="sticky bottom-0 w-full bg-background py-2 px-6 mt-auto">
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

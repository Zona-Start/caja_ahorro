'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import { Input } from '@repo/shadcn/input';
import { Edit, Loader2, Save, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useCompany, useCompanyMutation } from '../hooks/use-company';
import { CompanyFormValue, companyFormSchema } from '../schemas/company';
import { useCompanyStore } from '../store/company-store';

export function CompanyForm() {
  const [isEditing, setIsEditing] = useState(false);
  const { setCompany } = useCompanyStore();
  const { data: CompanyData, isLoading: isLoadingData } = useCompany();
  const { mutate: saveCompany, isPending: isSaving } = useCompanyMutation();

  const form = useForm<CompanyFormValue>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      id: 0,
      name: '',
      rif: '',
      address: '',
      phone: '',
      email: '',
      baseCurrencyCode: '',
      contactPerson: '',
      contactPhone: '',
    },
  });

  useEffect(() => {
    if (CompanyData?.data?.[0]) {
      const data = {
        ...CompanyData.data[0],
        id: Number(CompanyData.data[0].id),
      };
      form.reset(data);
      setCompany(data);
    }
  }, [CompanyData, form]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (CompanyData?.data?.[0]) {
      form.reset(CompanyData.data[0]);
    }
    setIsEditing(false);
  };

  const onSubmit = (data: CompanyFormValue) => {
    const { createdAt, updatedAt, ...filteredData } = data; // Omitir los campos createdAt y updatedAt
    saveCompany(filteredData, {
      onSuccess: () => {
        toast.success('Datos guardados exitosamente');
        setIsEditing(false);
        setCompany(filteredData);
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Error al guardar los datos');
      },
    });
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const DataRow = ({
    label,
    field,
  }: {
    label: string;
    field: keyof CompanyFormValue;
  }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 py-2">
      <div className="font-medium text-muted-foreground">{label}</div>
      <div>
        {isEditing ? (
          <div className="space-y-1">
            <Input {...form.register(field)} className="max-w-[300px]" />
            {form.formState.errors[field] && (
              <p className="text-sm text-red-500">
                {form.formState.errors[field]?.message}
              </p>
            )}
          </div>
        ) : (
          <span className="block text-sm md:text-base">
            {form.getValues(field) || 'NO REGISTRADO'}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Datos Caja de Ahorro</CardTitle>
          <div className="space-x-2">
            {isEditing ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4" />
                  <span className="hidden md:inline ml-1">Cancelar</span>
                </Button>
                <Button type="submit" size="sm" disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span className="hidden md:inline ml-1">Guardar</span>
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4" />
                <span className="hidden md:inline ml-1">Editar</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <DataRow label="Nombre" field="name" />
            <DataRow label="RIF" field="rif" />
            <DataRow label="Dirección" field="address" />
            <DataRow label="Teléfono" field="phone" />
            <DataRow label="Correo" field="email" />
            <DataRow label="Moneda Principal" field="baseCurrencyCode" />
            <DataRow label="Persona Contacto" field="contactPerson" />
            <DataRow label="Teléfono Contacto" field="contactPhone" />
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

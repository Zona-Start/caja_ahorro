'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import { Input } from '@repo/shadcn/input';
import { Edit, Loader2, Save, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useSavingBank, useSavingBankMutation } from '../hooks/use-saving-bank';
import { SavingBankFormValue, savingFormSchema } from '../schemas/saving-bank';
import { useSavingBankStore } from '../store/saving-bank-store';

export function SavingBankForm() {
  const [isEditing, setIsEditing] = useState(false);
  const { setSavingBank } = useSavingBankStore();
  const { data: savingBankData, isLoading: isLoadingData } = useSavingBank();
  const { mutate: saveSavingBank, isPending: isSaving } =
    useSavingBankMutation();

  const form = useForm<SavingBankFormValue>({
    resolver: zodResolver(savingFormSchema),
    defaultValues: {
      id: 0,
      name: '',
      rif: '',
      address: '',
      phone: '',
      email: '',
      personContact: '',
      phoneContact: '',
    },
  });

  useEffect(() => {
    if (savingBankData?.data?.[0]) {
      const data = {
        ...savingBankData.data[0],
        id: Number(savingBankData.data[0].id),
      };
      form.reset(data);
      setSavingBank(data);
    }
  }, [savingBankData, form]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (savingBankData?.data?.[0]) {
      form.reset(savingBankData.data[0]);
    }
    setIsEditing(false);
  };

  const onSubmit = (data: SavingBankFormValue) => {
    saveSavingBank(data, {
      onSuccess: () => {
        toast.success('Datos guardados exitosamente');
        setIsEditing(false);
        setSavingBank(data);
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
    field: keyof SavingBankFormValue;
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
            <DataRow label="Persona Contacto" field="personContact" />
            <DataRow label="Teléfono Contacto" field="phoneContact" />
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

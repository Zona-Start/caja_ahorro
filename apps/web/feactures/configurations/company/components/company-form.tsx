'use client';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@repo/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/card';
import { Input } from '@repo/shadcn/input';
import { Label } from '@repo/shadcn/label';
// import { Edit, Loader2, Save, X } from 'lucide-react';
import {
  Building2,
  Edit,
  FileText,
  Mail,
  MapPin,
  Phone,
  Save,
  User,
  X,
} from 'lucide-react';

import { IconWrapper } from '@/components/icon-wrapper';

import { toast } from '@/components/use-toast';
import React from 'react';
import { z } from 'zod';
import { useCompany, useCompanyMutation } from '../hooks/use-company';
import { companyFormSchema, CompanyFormValue } from '../schemas/company';
import { useCompanyStore } from '../store/company-store';

const Field = React.memo(
  ({
    icon,
    label,
    value,
    name,
    color,
    isEditing,
    onChange,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    name: string;
    color: string;
    isEditing: boolean;
    onChange: (name: string, value: string) => void;
  }) => {
    const [fieldValue, setFieldValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    // Actualizar el valor local cuando cambia el valor externo
    useEffect(() => {
      setFieldValue(value);
    }, [value]);

    // Manejar cambios en el input
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setFieldValue(newValue);
      onChange(name, newValue);
    };

    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <IconWrapper className="w-7 h-7">{icon}</IconWrapper>
          <Label htmlFor={name} className="font-medium">
            {label}
          </Label>
        </div>
        {isEditing ? (
          <Input
            ref={inputRef}
            id={name}
            name={name}
            value={fieldValue}
            onChange={handleInputChange}
            className="w-full"
          />
        ) : (
          <div className="p-2 bg-gray-50 dark:bg-neutral-800/50 rounded-md border">
            {value}
          </div>
        )}
      </div>
    );
  },
);

export function CompanyForm() {
  const { setCompany } = useCompanyStore();
  const { data: CompanyData, isLoading: isLoadingData } = useCompany();
  const { mutate: saveCompany, isPending: isSaving } = useCompanyMutation();

  const defaultCompany = {
    id: CompanyData?.data[0]?.id || 0,
    name: CompanyData?.data[0]?.name || '',
    rif: CompanyData?.data[0]?.rif || '',
    address: CompanyData?.data[0]?.address || '',
    phone: CompanyData?.data[0]?.phone || null,
    email: CompanyData?.data[0]?.email || '',
    contactPerson: CompanyData?.data[0]?.contactPerson || null,
    contactPhone: CompanyData?.data[0]?.contactPhone || null,
    contactEmail: CompanyData?.data[0]?.contactEmail || null,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [companyData, setCompanyData] = useState(defaultCompany);
  const [tempData, setTempData] = useState(defaultCompany);

  useEffect(() => {
    if (CompanyData?.data?.[0]) {
      const data = {
        ...CompanyData.data[0],
        id: Number(CompanyData.data[0].id),
      };
      setCompanyData(data);
      setTempData(data);
    }
  }, [CompanyData]);

  const handleEdit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Evita que el formulario se envíe y la página se refresque
    setTempData({ ...companyData });
    setIsEditing(true);
  };

  const handleCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsEditing(false);
    setTempData({ ...companyData });
  };

  const handleSave = async () => {
    try {
      const validatedData = companyFormSchema.parse(tempData); // Valida los datos usando el esquema
      setCompanyData({ ...validatedData });
      setIsEditing(false);
      onSubmit(validatedData); // Envía los datos validados
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Error de validación',
          description: 'Verifique los campos resaltados en rojo.',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Ocurrió un error inesperado.',
        });
      }
    }
  };

  const handleChange = (name: string, value: string) => {
    setTempData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const onSubmit = (data: CompanyFormValue) => {
    // Omitir los campos createdAt y updatedAt
    saveCompany(data, {
      onSuccess: () => {
        toast({
          title: 'Datos actualizados',
          description:
            'Los datos de la empresa han sido actualizados correctamente.',
        });
        setIsEditing(false);
        setCompany(data);
      },
      onError: (error: Error) => {
        toast({
          title: 'Error actualizando',
          description: error.message,
        });
      },
    });
  };

  return (
    <form>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">
          Información de la Caja de Ahorro
        </h1>

        <Card className="shadow-lg">
          <CardHeader className="bg-gray-50 dark:bg-neutral-800/50">
            <CardTitle className="flex items-center gap-2">
              <IconWrapper className="w-8 h-8">
                <Building2 />
              </IconWrapper>
              Datos de la Caja de Ahorro
            </CardTitle>
            <CardDescription>
              Información general y datos de contacto de la caja de ahorro
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Columna 1: Datos de la Empresa */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold mb-4">Datos Generales</h3>

                <Field
                  icon={<Building2 />}
                  label="Nombre de la Empresa"
                  value={companyData?.name}
                  name="name"
                  color="blue"
                  isEditing={isEditing}
                  onChange={handleChange}
                />

                <Field
                  icon={<FileText />}
                  label="RIF"
                  value={companyData?.rif}
                  name="rif"
                  color="purple"
                  isEditing={isEditing}
                  onChange={handleChange}
                />

                <Field
                  icon={<MapPin />}
                  label="Dirección"
                  value={companyData?.address}
                  name="address"
                  color="green"
                  isEditing={isEditing}
                  onChange={handleChange}
                />

                <Field
                  icon={<Phone />}
                  label="Teléfono"
                  value={companyData?.phone ?? ''}
                  name="phone"
                  color="orange"
                  isEditing={isEditing}
                  onChange={handleChange}
                />

                <Field
                  icon={<Mail />}
                  label="Correo Electrónico"
                  value={companyData?.email ?? ''}
                  name="email"
                  color="red"
                  isEditing={isEditing}
                  onChange={handleChange}
                />
              </div>

              {/* Columna 2: Datos de Contacto */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold mb-4">
                  Persona de Contacto
                </h3>

                <Field
                  icon={<User />}
                  label="Nombre y Apellido"
                  value={companyData?.contactPerson ?? ''}
                  name="contactPerson"
                  color="cyan"
                  isEditing={isEditing}
                  onChange={handleChange}
                />

                <Field
                  icon={<Phone />}
                  label="Teléfono"
                  value={companyData?.contactPhone ?? ''}
                  name="contactPhone"
                  color="teal"
                  isEditing={isEditing}
                  onChange={handleChange}
                />

                <Field
                  icon={<Mail />}
                  label="Correo Electrónico"
                  value={companyData?.contactEmail ?? 'NO REGISTRADO'}
                  name="contactEmail"
                  color="indigo"
                  isEditing={isEditing}
                  onChange={handleChange}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-2 bg-gray-50 dark:bg-sidebar">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="mr-2 h-4 w-4" /> Cancelar
                </Button>
                <Button type="button" onClick={handleSave} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" /> Guardar Cambios
                </Button>
              </>
            ) : (
              <Button onClick={handleEdit}>
                <Edit className=" h-4 w-4" />
                Editar Información
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </form>
  );
}

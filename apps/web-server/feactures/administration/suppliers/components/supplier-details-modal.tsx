'use client';

import { Badge } from '@repo/shadcn/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import { Button } from '@repo/shadcn/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Separator } from '@repo/shadcn/separator';
import {
  Building2,
  Hash,
  IdCard,
  Mail,
  MapPin,
  Phone,
  Tag,
  User,
} from 'lucide-react';
import { z } from 'zod';
import { SUPPLIER_CATEGORY_TYPES } from '../schemas/suppliers-options';
import { supplierApiSchema } from '../schemas/suppliers-response-api';
import { Supplier } from '../schemas/suppliers.schema';

type SupplierApiData = z.infer<typeof supplierApiSchema>;
type SupplierData = SupplierApiData | Supplier;

interface SupplierDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: SupplierData | null;
}

export function SupplierDetailsModal({
  open,
  onOpenChange,
  supplier,
}: SupplierDetailsModalProps) {
  if (!supplier) return null;

  type BadgeVariant =
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'success'
    | 'warning';

  const getStatusBadge = (
    status: string | undefined,
  ): {
    variant: BadgeVariant;
    label: string;
  } => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'activo':
        return { variant: 'success', label: 'Activo' };
      case 'inactive':
      case 'inactivo':
        return { variant: 'destructive', label: 'Inactivo' };
      case 'suspended':
      case 'suspendido':
        return { variant: 'warning', label: 'Suspendido' };
      default:
        return { variant: 'outline', label: status || 'Sin estado' };
    }
  };

  const statusInfo = getStatusBadge(supplier.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Detalles del Proveedor
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
            Información completa del proveedor seleccionado
          </DialogDescription>
          <Separator />
        </DialogHeader>

        <div className="space-y-4">
          {/* Información Básica */}
          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    <Hash className="h-4 w-4" />
                    Código
                  </div>
                  <p className="text-sm text-gray-900 dark:text-gray-100 font-mono bg-gray-50 dark:bg-neutral-800 px-2 py-1 rounded">
                    {supplier.code ?? 'Sin código'}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    <IdCard className="h-4 w-4" />
                    RIF/NIT
                  </div>
                  <p className="text-sm text-gray-900 dark:text-gray-100 font-mono bg-gray-50 dark:bg-neutral-800 px-2 py-1 rounded">
                    {supplier.taxId}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  <Building2 className="h-4 w-4" />
                  Nombre de la Empresa
                </div>
                <p className="text-base font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-neutral-800 px-3 py-2 rounded">
                  {supplier.name}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    <Tag className="h-4 w-4" />
                    Categoría
                  </div>
                  <Badge variant="outline" className="text-sm">
                    {SUPPLIER_CATEGORY_TYPES[
                      supplier?.category as keyof typeof SUPPLIER_CATEGORY_TYPES
                    ] || supplier?.category}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    <Tag className="h-4 w-4" />
                    Estado
                  </div>
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de Contacto */}
          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                Información de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {supplier.contactName && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    <User className="h-4 w-4" />
                    Persona de Contacto
                  </div>
                  <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-neutral-800 px-3 py-2 rounded">
                    {supplier.contactName}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {supplier.contactEmail && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                      <Mail className="h-4 w-4" />
                      Correo Electrónico
                    </div>
                    <p className="text-sm text-gray-900 dark:text-gray-100 font-mono bg-gray-50 dark:bg-neutral-800 px-2 py-1 rounded break-all">
                      {supplier.contactEmail}
                    </p>
                  </div>
                )}

                {supplier.contactPhone && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                      <Phone className="h-4 w-4" />
                      Teléfono
                    </div>
                    <p className="text-sm text-gray-900 dark:text-gray-100 font-mono bg-gray-50 dark:bg-neutral-800 px-2 py-1 rounded">
                      {supplier.contactPhone}
                    </p>
                  </div>
                )}
              </div>

              {!supplier.contactName &&
                !supplier.contactEmail &&
                !supplier.contactPhone && (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      No hay información de contacto disponible
                    </p>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Información Adicional */}
          {supplier.address && (
            <Card className="border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  Ubicación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4" />
                    Dirección
                  </div>
                  <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-neutral-800 px-3 py-2 rounded leading-relaxed">
                    {supplier.address}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

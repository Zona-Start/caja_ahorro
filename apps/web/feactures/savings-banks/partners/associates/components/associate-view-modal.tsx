'use client';

import { useBanksQuery } from '@/feactures/banks/bank-directory/hooks/use-banks-querys';
import { useCategoriesTypesGroup } from '@/feactures/common/category-types/hooks/use-querys-category-types';
import { useStatesQuery } from '@/feactures/common/states/hooks/use-querys-states';
import { useTypePayroll } from '@/feactures/configurations/type-payroll/hooks/use-query-type-payroll';
import { formatCurrency } from '@/lib/formatCurrent';
import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { ScrollArea } from '@repo/shadcn/scroll-area';
import { ESTATUS_TYPES } from '../schemas/associates-options';
import { AssociatesMutate } from '../schemas/associates.schema';

interface AssociateViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  associateData?: Partial<AssociatesMutate>;
}

// Helper component for displaying a single data point
const DataRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="grid grid-cols-2 items-center gap-2 py-1 border-b border-border/50">
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <p className="text-sm text-right md:text-left">{value || 'N/A'}</p>
  </div>
);

export function AssociateViewModal({
  open,
  onOpenChange,
  associateData,
}: AssociateViewModalProps) {
  const { data: StatesQuery } = useStatesQuery();
  const { data: CategoryFrecuentia } = useCategoriesTypesGroup('DISCOUNT_FREQ');
  const { data: AssociatedType } = useCategoriesTypesGroup('ASSOCIATED_TYPE');
  const { data: PayrollType } = useTypePayroll();
  const { data: Banks } = useBanksQuery();

  const findLabel = (
    id: number | undefined,
    data: any[] | undefined,
    keyField = 'id',
    labelField = 'description',
  ) => {
    if (!id || !data) return 'N/A';
    const item = data.find((d) => d[keyField] === id);
    return item ? item[labelField] : 'N/A';
  };

  const findStateLabel = (id: number | undefined) => {
    if (!id || !StatesQuery) return 'N/A';
    const item = StatesQuery.find((d) => d.id === id);
    return item ? item.name : 'N/A';
  };

  const findBankLabel = (id: number | undefined) => {
    if (!id || !Banks?.data) return 'N/A';
    const item = Banks.data.find((d) => d.id === id);
    return item ? item.name : 'N/A';
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] z-50 backdrop-blur-lg">
        <DialogHeader>
          <DialogTitle>Detalles del Asociado</DialogTitle>
          <DialogDescription>
            Información detallada de {associateData?.fullname}.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[calc(100vh-250px)] pr-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información Personal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <DataRow
                  label="Nombre Completo"
                  value={associateData?.fullname}
                />
                <DataRow
                  label="Cédula"
                  value={`${associateData?.nationality === 'VENEZOLANO' ? 'V-' : 'E-'}${associateData?.cedula}`}
                />
                <DataRow label="Género" value={associateData?.gender} />
                <DataRow
                  label="Fecha de Nacimiento"
                  value={formatDate(associateData?.birthdate)}
                />
                <DataRow
                  label="Estatus"
                  value={
                    associateData?.status
                      ? ESTATUS_TYPES[
                          associateData.status as keyof typeof ESTATUS_TYPES
                        ]
                      : 'N/A'
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Información de Contacto y Ubicación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <DataRow label="Teléfono" value={associateData?.phone} />
                <DataRow
                  label="Correo Electrónico"
                  value={associateData?.email}
                />
                <DataRow
                  label="Ubicación (Estado)"
                  value={findStateLabel(associateData?.localityId)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Datos Laborales y de la Caja de Ahorro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <DataRow
                  label="Fecha de Ingreso"
                  value={formatDate(associateData?.dateAdmission)}
                />
                <DataRow
                  label="Fecha de Egreso"
                  value={formatDate(associateData?.dateGraduation)}
                />
                <DataRow label="Cargo" value={associateData?.jobTitle} />
                <DataRow
                  label="Tipo de Trabajador"
                  value={findLabel(
                    associateData?.associatedTypeId,
                    AssociatedType?.data,
                  )}
                />
                <DataRow
                  label="Tipo de Nómina"
                  value={findLabel(
                    associateData?.payrollTypeId,
                    PayrollType?.data,
                    'id',
                    'description',
                  )}
                />
                <DataRow
                  label="Frecuencia de Descuento"
                  value={findLabel(
                    associateData?.discountFrequencyId,
                    CategoryFrecuentia?.data,
                  )}
                />
                <DataRow
                  label="Posee Credi-Nómina"
                  value={associateData?.isPayrollCredit ? 'Sí' : 'No'}
                />
                <DataRow
                  label="Sueldo Base"
                  value={formatCurrency(
                    Number(associateData?.baseSalary),
                    'VES',
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Datos Bancarios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <DataRow
                  label="Banco"
                  value={findBankLabel(associateData?.bankDirectoryId)}
                />
                <DataRow
                  label="Número de Cuenta"
                  value={associateData?.accountNumber}
                />
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

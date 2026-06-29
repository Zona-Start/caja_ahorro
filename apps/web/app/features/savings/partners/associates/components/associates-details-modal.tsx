import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { ScrollArea } from '@repo/shadcn/scroll-area';
import { Badge } from '@repo/shadcn/components/ui/badge';
import {
  Building2,
  Calendar,
  CreditCard,
  Hash,
  Mail,
  MapPin,
  Phone,
  User,
  Wallet,
  Loader2,
} from 'lucide-react';
import { useAssociateQuery } from '../hooks/use-associates-query';
import { ESTATUS_TYPES } from '../schemas/associates-options';
import { useStatesQuery } from '@/features/core/states/hooks/use-querys-states';
import { useBanksQuery } from '@/features/banks/bank-directory/hooks/use-banks-querys';
import { useCategoriesQuery } from '@/features/core/categories/hooks/use-categories-queries';
import { format } from 'date-fns';

interface AssociatesDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  associateId: string;
}

const DetailRow = ({
  label,
  value,
  icon: Icon,
  mono,
}: {
  label: string;
  value: string | null | undefined;
  icon?: React.ElementType;
  mono?: boolean;
}) => (
  <div className="flex items-start gap-3 py-2">
    {Icon && (
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
    )}
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm ${mono ? 'font-mono' : ''}`}>{value ?? '—'}</p>
    </div>
  </div>
);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="mb-4">
    <h4 className="text-sm font-semibold text-foreground/80 mb-2 border-b pb-1">
      {title}
    </h4>
    <div className="grid grid-cols-2 gap-x-6 gap-y-1">{children}</div>
  </div>
);

const SkeletonBlock = () => (
  <div className="space-y-4 py-8">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="space-y-2">
        <div className="h-3 w-24 rounded bg-muted animate-pulse" />
        <div className="h-5 w-40 rounded bg-muted animate-pulse" />
      </div>
    ))}
  </div>
);

const formatDate = (d: string | null | undefined) => {
  if (!d) return null;
  try {
    return format(new Date(d + 'T12:00:00'), 'dd/MM/yyyy');
  } catch {
    return d;
  }
};

const formatCurrency = (n: string | null | undefined) => {
  if (!n) return '0.00';
  return Number(n).toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const nationalityLabels: Record<string, string> = {
  VENEZOLANO: 'Venezolano',
  EXTRANJERO: 'Extranjero',
};

const genderLabels: Record<string, string> = {
  MASCULINO: 'Masculino',
  FEMENINO: 'Femenino',
};

const statusVariant = (
  status: string,
): 'default' | 'destructive' | 'outline' | 'secondary' | 'success' | 'warning' => {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'INACTIVE':
      return 'destructive';
    case 'PENDING':
      return 'warning';
    case 'SUSPENDED':
      return 'secondary';
    case 'LOCKED':
      return 'outline';
    case 'RETIRED':
      return 'destructive';
    case 'ARCHIVED':
      return 'default';
    default:
      return 'default';
  }
};

export function AssociatesDetailsModal({
  open,
  onOpenChange,
  associateId,
}: AssociatesDetailsModalProps) {
  const {
    data: associateResponse,
    isLoading,
    isError,
  } = useAssociateQuery(associateId);

  const { data: states } = useStatesQuery();
  const { data: banks } = useBanksQuery();
  const { data: discountFreqData } = useCategoriesQuery({
    page: 1,
    limit: 100,
    type: 'discount_frequency',
  });
  const { data: associateTypeData } = useCategoriesQuery({
    page: 1,
    limit: 100,
    type: 'associate_type',
  });
  const { data: payrollTypeData } = useCategoriesQuery({
    page: 1,
    limit: 100,
    type: 'payroll_type',
  });

  const associate = associateResponse?.data;

  const stateName = states?.find((s: any) => s.id === associate?.localityId)
    ?.name;
  const bankEntry = banks?.data?.find(
    (b: any) => b.id === associate?.bankDirectoryId,
  );
  const discountFreqName = discountFreqData?.data?.find(
    (c: any) => c.id === associate?.discountFrequencyId,
  )?.name;
  const associateTypeName = associateTypeData?.data?.find(
    (c: any) => c.id === associate?.associatedTypeId,
  )?.name;
  const payrollTypeEntry = payrollTypeData?.data?.find(
    (c: any) => c.id === associate?.payrollTypeId,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isLoading
              ? 'Cargando...'
              : associate?.fullname ?? 'Asociado'}
          </DialogTitle>
          <DialogDescription className="font-mono">
            C.I. {associate?.cedula ?? '—'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(100vh-240px)] pr-4">
          {isLoading && <SkeletonBlock />}

          {isError && (
            <div className="py-8 text-center text-sm text-destructive">
              Error al cargar los datos del asociado.
            </div>
          )}

          {associate && (
            <div className="pt-2">
              {/* --- DATOS PERSONALES --- */}
              <Section title="Datos Personales">
                <DetailRow
                  label="Nacionalidad"
                  value={nationalityLabels[associate.nationality]}
                  icon={MapPin}
                />
                <DetailRow
                  label="Género"
                  value={genderLabels[associate.gender]}
                  icon={User}
                />
                <DetailRow
                  label="Fecha de Nacimiento"
                  value={formatDate(associate.birthdate)}
                  icon={Calendar}
                />
              </Section>

              {/* --- INFORMACIÓN LABORAL --- */}
              <Section title="Información Laboral">
                <DetailRow
                  label="Fecha de Ingreso"
                  value={formatDate(associate.dateAdmission)}
                  icon={Calendar}
                />
                <DetailRow
                  label="Fecha de Egreso"
                  value={formatDate(associate.dateGraduation)}
                  icon={Calendar}
                />
                <DetailRow
                  label="Cargo"
                  value={associate.jobTitle}
                  icon={Building2}
                />
                <DetailRow
                  label="Sueldo Base"
                  value={
                    associate.baseSalary
                      ? `Bs. ${formatCurrency(associate.baseSalary)}`
                      : null
                  }
                  icon={Wallet}
                />
                <DetailRow
                  label="Tipo de Trabajador"
                  value={associateTypeName ?? '—'}
                  icon={User}
                />
                <DetailRow
                  label="Tipo de Nómina"
                  value={
                    payrollTypeEntry
                      ? `${payrollTypeEntry.code} - ${payrollTypeEntry.name}`
                      : '—'
                  }
                  icon={CreditCard}
                />
                <DetailRow
                  label="Credi-Nómina"
                  value={associate.isPayrollCredit ? 'Sí' : 'No'}
                  icon={CreditCard}
                />
              </Section>

              {/* --- CONTACTO --- */}
              <Section title="Contacto">
                <DetailRow
                  label="Teléfono"
                  value={associate.phone}
                  icon={Phone}
                />
                <DetailRow
                  label="Correo Electrónico"
                  value={associate.email}
                  icon={Mail}
                />
                <DetailRow
                  label="Estado / Localidad"
                  value={stateName}
                  icon={MapPin}
                />
              </Section>

              {/* --- CUENTA BANCARIA --- */}
              <Section title="Cuenta Bancaria">
                <DetailRow
                  label="Número de Cuenta"
                  value={associate.accountNumber}
                  icon={Hash}
                  mono
                />
                <DetailRow
                  label="Moneda"
                  value={associate.currencyCode}
                  icon={Wallet}
                />
                <DetailRow
                  label="Balance"
                  value={`Bs. ${formatCurrency(associate.balance)}`}
                  icon={Wallet}
                />
                <DetailRow
                  label="Fecha de Apertura"
                  value={formatDate(associate.openingDate)}
                  icon={Calendar}
                />
                <DetailRow
                  label="Banco"
                  value={
                    bankEntry
                      ? `${bankEntry.code} - ${bankEntry.name}`
                      : '—'
                  }
                  icon={Building2}
                />
              </Section>

              {/* --- ESTADO --- */}
              <Section title="Estado">
                <div className="flex items-start gap-3 py-2">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Estatus</p>
                    <Badge
                      variant={statusVariant(associate.status)}
                      className="mt-0.5"
                    >
                      {ESTATUS_TYPES[associate.status as keyof typeof ESTATUS_TYPES] ??
                        associate.status}
                    </Badge>
                  </div>
                </div>
                <DetailRow
                  label="Frecuencia de Descuento"
                  value={discountFreqName ?? '—'}
                />
              </Section>
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end pt-2 border-t">
          <button
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium border hover:bg-accent transition-colors"
          >
            Cerrar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

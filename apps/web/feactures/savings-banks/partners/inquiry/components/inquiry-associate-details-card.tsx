import { IconWrapper } from '@/components/icon-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import { Badge } from '@repo/shadcn/components/ui/badge';
import { Label } from '@repo/shadcn/components/ui/label';
import { User } from 'lucide-react';
import { ASSOCIATE_STATUS_TYPES } from '../schemas/inquiry-options';
import { AssociateDetails } from '../schemas/inquiry-schema';

interface InquiryAssociateDetailsCardProps {
  associate: AssociateDetails;
}

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex justify-between py-2 border-b border-border/50 text-sm">
    <p className="font-medium text-muted-foreground">{label}</p>
    <p className="text-right">{value || 'N/A'}</p>
  </div>
);

export function InquiryAssociateDetailsCard({
  associate,
}: InquiryAssociateDetailsCardProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-VE');
  };

  const status = associate.status;
  const statusText =
    ASSOCIATE_STATUS_TYPES[status as keyof typeof ASSOCIATE_STATUS_TYPES] ||
    status;
  const statusVariant:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'success'
    | 'warning' = (() => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'secondary';
      case 'SUSPENDED':
        return 'warning';
      case 'LOCKED':
        return 'destructive';
      case 'RETIRED':
        return 'default';
      case 'ARCHIVED':
        return 'outline';
      default:
        return 'default';
    }
  })();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconWrapper className="w-6 h-6">
            <User />
          </IconWrapper>
          Datos Básicos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Nombre Completo
            </Label>
            <p className="text-lg font-semibold">{associate.fullname}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Cédula
            </Label>
            <p className="text-lg">{`${associate.nationality.charAt(0)}-${associate.cedula}`}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Estado
            </Label>
            <div className="mt-1">{associate.nationality}</div>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Género
            </Label>
            <div className="mt-1">{associate.gender}</div>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Fecha de Ingreso
            </Label>
            <p>{formatDate(associate.admissionDate)}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Fecha de Egreso
            </Label>
            <p>{formatDate(associate.graduationDate)}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Localidad
            </Label>
            <div className="mt-1">{associate.locality}</div>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Número de Cuenta
            </Label>
            <div className="mt-1">{associate.accountNumber}</div>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Estado
            </Label>
            <div className="mt-1">
              {' '}
              <Badge className="text-sm" variant={statusVariant as any}>
                {statusText}
              </Badge>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Credi-Nómina
            </Label>
            <div className="mt-1">
              {associate.isPayrollCredit ? 'Sí' : 'No'}
            </div>
          </div>
          {associate.isPayrollCredit && (
            <div className="col-span-2">
              <div className="mt-4">
                <Badge className="bg-red-700 text-white text-xl font-semibold">
                  BLOQUEADO POSEE CREDI-NOMINA ACTIVO
                </Badge>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/card';
import { Badge } from '@repo/shadcn/badge';
import { Separator } from '@repo/shadcn/separator';
import {
  User,
  Calendar,
  MapPin,
  CreditCard,
  Building2,
} from 'lucide-react';
import { ASSOCIATE_STATUS_TYPES } from '../schemas/inquiry-options';
import type { AssociateStatement } from '../schemas/inquiry-schema';

interface InquiryAssociateDetailsCardProps {
  associate: AssociateStatement;
}

export function InquiryAssociateDetailsCard({
  associate,
}: InquiryAssociateDetailsCardProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-VE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const status = associate.status;
  const statusText =
    ASSOCIATE_STATUS_TYPES[status as keyof typeof ASSOCIATE_STATUS_TYPES] ||
    status;

  const statusVariant = (() => {
    switch (status) {
      case 'ACTIVE':
        return 'success' as const;
      case 'INACTIVE':
        return 'secondary' as const;
      case 'SUSPENDED':
        return 'warning' as const;
      case 'LOCKED':
        return 'destructive' as const;
      case 'RETIRED':
        return 'outline' as const;
      default:
        return 'default' as const;
    }
  })();

  const details = [
    {
      label: 'Nombre Completo',
      value: associate.fullname,
      icon: User,
      highlight: true,
    },
    {
      label: 'Cédula',
      value: `${associate.nationality.charAt(0)}-${associate.cedula}`,
      icon: CreditCard,
    },
    {
      label: 'Estado',
      value: (
        <Badge variant={statusVariant} className="text-sm">
          {statusText}
        </Badge>
      ) as any,
    },
    {
      label: 'Nacionalidad',
      value: associate.nationality,
    },
    {
      label: 'Género',
      value: associate.gender,
    },
    {
      label: 'Fecha de Ingreso',
      value: formatDate(associate.admissionDate),
      icon: Calendar,
    },
    {
      label: 'Fecha de Egreso',
      value: formatDate(associate.graduationDate),
      icon: Calendar,
    },
    {
      label: 'Localidad',
      value: associate.locality || 'N/A',
      icon: MapPin,
    },
    {
      label: 'Número de Cuenta',
      value: associate.accountNumber || 'N/A',
      icon: CreditCard,
    },
    {
      label: 'Banco',
      value: associate.bankName || 'N/A',
      icon: Building2,
    },
    {
      label: 'Credi-Nómina',
      value: associate.isPayrollCredit ? 'Sí' : 'No',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <User className="h-4 w-4" />
          </div>
          Datos del Asociado
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {details.map((detail) => (
            <div key={detail.label}>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                {detail.label}
              </p>
              <div className={detail.highlight ? 'text-base font-semibold' : 'text-sm'}>
                {detail.value}
              </div>
            </div>
          ))}
        </div>

        {(status === 'RETIRED' || associate.isPayrollCredit) && (
          <>
            <Separator className="my-4" />
            <div className="flex flex-wrap gap-2">
              {associate.isPayrollCredit && (
                <Badge
                  variant="destructive"
                  className="text-sm font-semibold px-3 py-1"
                >
                  BLOQUEADO - CREDI-NÓMINA ACTIVO
                </Badge>
              )}
              {status === 'RETIRED' && (
                <Badge
                  variant="destructive"
                  className="text-sm font-semibold px-3 py-1"
                >
                  ASOCIADO LIQUIDADO
                </Badge>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

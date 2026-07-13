import { Content } from 'pdfmake/interfaces';

export interface AssociateReportRow {
  cedula: string;
  fullname: string;
  dateAdmission: string | null;
  status: string;
  isPayrollCredit: boolean;
  gender: string | null;
  payrollType: string | null;
  associatedType: string | null;
  jobTitle: string | null;
  phone: string | null;
  email: string | null;
}

const STATUS_MAP: Record<string, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  PENDING: 'Pendiente',
  SUSPENDED: 'Suspendido',
  LOCKED: 'Bloqueado',
  RETIRED: 'Retirado',
  ARCHIVED: 'Archivado',
};

function normalize(value: string | null): string {
  if (!value) return 'N/A';
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function formatDate(value: string | null): string {
  if (!value) return 'N/A';
  const [y, m, d] = value.split('-');
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

function translateStatus(value: string | null): string {
  if (!value) return 'N/A';
  return STATUS_MAP[value] ?? normalize(value);
}

export function buildAssociatesTableContent(data: AssociateReportRow[]): Content {
  const tableBody = [
    [
      { text: 'Cédula', style: 'tableHeader' },
      { text: 'Nombre y Apellido', style: 'tableHeader' },
      { text: 'F. Ingreso', style: 'tableHeader' },
      { text: 'Estatus', style: 'tableHeader' },
      { text: 'Credi-Nómina', style: 'tableHeader' },
      { text: 'Género', style: 'tableHeader' },
      { text: 'Tipo Nómina', style: 'tableHeader' },
      { text: 'Tipo Trabajador', style: 'tableHeader' },
      { text: 'Cargo', style: 'tableHeader' },
    ],
    ...data.map((item) => [
      item.cedula ?? 'N/A',
      item.fullname ?? 'N/A',
      formatDate(item.dateAdmission),
      translateStatus(item.status),
      item.isPayrollCredit ? 'Sí' : 'No',
      normalize(item.gender),
      item.payrollType ?? 'N/A',
      item.associatedType ?? 'N/A',
      normalize(item.jobTitle),
    ]),
  ];

  return {
    table: {
      headerRows: 1,
      widths: [55, '*', 55, 50, 45, 50, 55, 60, 65],
      body: tableBody,
    },
    layout: 'lightHorizontalLines',
  };
}

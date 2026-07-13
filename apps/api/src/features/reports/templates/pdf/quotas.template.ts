import { Content } from 'pdfmake/interfaces';

export interface QuotaReportRow {
  cedula: string;
  fullname: string;
  reference: string | null;
  installmentNumber: number;
  dueDate: string;
  principalBalancePending: string;
  paymentStatus: string;
}

const STATUS_MAP: Record<string, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  OVERDUE: 'Vencido',
  PARTIAL: 'Parcial',
  CANCELED: 'Cancelado',
  DONE: 'Pagado',
};

function translate(value: string, map: Record<string, string>): string {
  return map[value] ?? value;
}

function formatDate(value: string): string {
  const [y, m, d] = value.split('-');
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

function formatAmount(value: string): string {
  const num = Number(value);
  if (isNaN(num)) return value;
  return num.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function buildQuotasTableContent(data: QuotaReportRow[]): Content {
  const tableBody = [
    [
      { text: 'Cédula', style: 'tableHeader' },
      { text: 'Nombre y Apellidos', style: 'tableHeader' },
      { text: 'Referencia', style: 'tableHeader' },
      { text: 'N° Cuota', style: 'tableHeader' },
      { text: 'Fecha Vencimiento', style: 'tableHeader' },
      { text: 'Monto Cuota', style: 'tableHeader' },
      { text: 'Estado', style: 'tableHeader' },
    ],
    ...data.map((item) => [
      item.cedula,
      item.fullname,
      item.reference ?? 'N/A',
      item.installmentNumber.toString(),
      formatDate(item.dueDate),
      formatAmount(item.principalBalancePending),
      translate(item.paymentStatus, STATUS_MAP),
    ]),
  ];

  return {
    table: {
      headerRows: 1,
      widths: [50, '*', 65, 35, 55, 55, 50],
      body: tableBody,
    },
    layout: 'lightHorizontalLines',
  };
}

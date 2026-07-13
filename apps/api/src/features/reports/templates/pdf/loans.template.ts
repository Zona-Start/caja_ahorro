import { Content } from 'pdfmake/interfaces';

export interface LoanReportRow {
  requestDate: string | null;
  reference: string | null;
  cedula: string;
  fullname: string;
  loanType: string | null;
  requestedAmount: string;
  totalPayable: string | null;
  termUnits: number | null;
  status: string;
}

const STATUS_MAP: Record<string, string> = {
  REQUESTED: 'Solicitado',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  CANCELLED: 'Cancelado',
  PENDING_DISBURSEMENT_BANK_BATCH: 'Pendiente Desembolso',
  DISBURSED: 'Desembolsado',
  DISBURSEMENT_FAILED: 'Desembolso Fallido',
  DISBURSED_REVERSED: 'Desembolso Reversado',
  IN_PAYMENT: 'En Pago',
  PAID: 'Pagado',
  OVERDUE: 'Vencido',
  ADJUSTED: 'Ajustado',
};

function translate(value: string, map: Record<string, string>): string {
  return map[value] ?? value;
}

function formatDate(value: string | null): string {
  if (!value) return 'N/A';
  const [y, m, d] = value.split('-');
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

function formatAmount(value: string | null): string {
  if (!value) return 'N/A';
  const num = Number(value);
  if (isNaN(num)) return value;
  return num.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function buildLoansTableContent(data: LoanReportRow[]): Content {
  const tableBody = [
    [
      { text: 'Fecha', style: 'tableHeader' },
      { text: 'Referencia', style: 'tableHeader' },
      { text: 'Cédula', style: 'tableHeader' },
      { text: 'Nombre y Apellidos', style: 'tableHeader' },
      { text: 'Tipo Préstamo', style: 'tableHeader' },
      { text: 'Monto Solicitado', style: 'tableHeader' },
      { text: 'Total a Pagar', style: 'tableHeader' },
      { text: 'Cuotas', style: 'tableHeader' },
      { text: 'Estado', style: 'tableHeader' },
    ],
    ...data.map((item) => [
      formatDate(item.requestDate),
      item.reference ?? 'N/A',
      item.cedula,
      item.fullname,
      item.loanType ?? 'N/A',
      formatAmount(item.requestedAmount),
      formatAmount(item.totalPayable),
      item.termUnits?.toString() ?? 'N/A',
      translate(item.status, STATUS_MAP),
    ]),
  ];

  return {
    table: {
      headerRows: 1,
      widths: [50, 60, 50, '*', 55, 55, 55, 35, 55],
      body: tableBody,
    },
    layout: 'lightHorizontalLines',
  };
}

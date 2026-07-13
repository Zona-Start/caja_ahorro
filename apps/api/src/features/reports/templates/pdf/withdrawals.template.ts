import { Content } from 'pdfmake/interfaces';

export interface WithdrawalReportRow {
  withdrawalDate: Date | null;
  associateFullname: string | null;
  associateCedula: string | null;
  withdrawalType: string | null;
  requestedAmount: string;
  administrativeFee: string | null;
  disbursedAmount: string | null;
  referenceCode: string | null;
  paymentMethod: string | null;
  status: string;
}

const STATUS_MAP: Record<string, string> = {
  REQUESTED: 'Solicitado',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  REVERSED: 'Reversado',
  CANCELLED: 'Cancelado',
  PENDING_DISBURSEMENT_BANK_BATCH: 'Pendiente Desembolso',
  DISBURSED: 'Desembolsado',
  PROCESSED: 'Procesado',
  DISBURSEMENT_FAILED: 'Desembolso Fallido',
  DISBURSED_REVERSED: 'Desembolso Reversado',
  ADJUSTED: 'Ajustado',
};

const PAYMENT_METHOD_MAP: Record<string, string> = {
  CASH: 'Efectivo',
  BANK_TRANSFER: 'Transferencia',
  CHECK: 'Cheque',
  DEPOSIT: 'Depósito',
  OTHER: 'Otro',
  MOBILE_PAYMENT: 'Pago Móvil',
};

function normalize(value: string | null): string {
  if (!value) return 'N/A';
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function translate(value: string | null, map: Record<string, string>): string {
  if (!value) return 'N/A';
  return map[value] ?? normalize(value);
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

export function buildWithdrawalsTableContent(data: WithdrawalReportRow[]): Content {
  const tableBody = [
    [
      { text: 'Fecha', style: 'tableHeader' },
      { text: 'Asociado', style: 'tableHeader' },
      { text: 'Cédula', style: 'tableHeader' },
      { text: 'Tipo Retiro', style: 'tableHeader' },
      { text: 'Monto Solicitado', style: 'tableHeader' },
      { text: 'Comisión', style: 'tableHeader' },
      { text: 'Monto Desembolsado', style: 'tableHeader' },
      { text: 'Referencia', style: 'tableHeader' },
      { text: 'Estado', style: 'tableHeader' },
    ],
    ...data.map((item) => {
      const datePart = item.withdrawalDate
        ? item.withdrawalDate.toISOString().split('T')[0]
        : null;
      return [
        formatDate(datePart),
        item.associateFullname ?? 'N/A',
        item.associateCedula ?? 'N/A',
        item.withdrawalType ?? 'N/A',
        formatAmount(item.requestedAmount),
        formatAmount(item.administrativeFee),
        formatAmount(item.disbursedAmount),
        item.referenceCode ?? 'N/A',
        translate(item.status, STATUS_MAP),
      ];
    }),
  ];

  return {
    table: {
      headerRows: 1,
      widths: [50, '*', 50, 55, 55, 50, 55, 55, 55],
      body: tableBody,
    },
    layout: 'lightHorizontalLines',
  };
}

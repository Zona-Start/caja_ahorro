import { Content } from 'pdfmake/interfaces';

export type VariationStatus = 'INCLUSION' | 'VARIACION' | 'EXCLUSION';
export type VariationInstrumentType = 'LOAN' | 'CREDIT';

export interface VariationReportRow {
  cedula: string;
  fullname: string;
  workerType: string | null;
  payrollCode: string | null;
  instrumentType: VariationInstrumentType;
  totalPayable: string | null;
  termUnits: number | null;
  installmentAmount: string | null;
  status: VariationStatus;
  pendingAmount: string | null;
  paymentCapacity: string | null;
  updatedQuota: number | null;
}

const INSTRUMENT_LABEL: Record<VariationInstrumentType, string> = {
  LOAN: 'PRÉSTAMO',
  CREDIT: 'CRÉDITO',
};

function formatAmount(value: string | null): string {
  if (!value) return 'N/A';
  const num = Number(value);
  if (isNaN(num)) return value;
  return num.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatOptionalAmount(value: string | null): string {
  if (value === null || value === undefined || value === '') return '';
  return formatAmount(value);
}

function formatOptionalNumber(value: number | null): string {
  if (value === null || value === undefined) return '';
  return value.toString();
}

export function buildVariationsTableContent(
  data: VariationReportRow[],
): Content {
  const tableBody = [
    [
      { text: 'CÉDULA', style: 'tableHeader' },
      { text: 'NOMBRE Y APELLIDOS', style: 'tableHeader' },
      { text: 'TIPO PERSONAL', style: 'tableHeader' },
      { text: 'TIPO PRÉSTAMO', style: 'tableHeader' },
      { text: 'OPERACIÓN', style: 'tableHeader' },
      { text: 'MONTO PRÉSTAMO', style: 'tableHeader' },
      { text: 'CANT. CUOTAS', style: 'tableHeader' },
      { text: 'MONTO CUOTA', style: 'tableHeader' },
      { text: 'VARIACIÓN', style: 'tableHeader' },
      { text: 'PENDIENTE', style: 'tableHeader' },
      { text: 'CAPACIDAD', style: 'tableHeader' },
      { text: 'CUOTA ACTUALIZADA', style: 'tableHeader' },
    ],
    ...data.map((item) => {
      const isExclusion = item.status === 'EXCLUSION';

      return [
        item.cedula,
        item.fullname,
        item.workerType ?? 'N/A',
        item.payrollCode ?? 'N/A',
        INSTRUMENT_LABEL[item.instrumentType],
        formatAmount(item.totalPayable),
        isExclusion ? '' : (item.termUnits?.toString() ?? 'N/A'),
        isExclusion ? '' : formatAmount(item.installmentAmount),
        item.status,
        isExclusion ? '' : formatOptionalAmount(item.pendingAmount),
        isExclusion ? '' : formatOptionalAmount(item.paymentCapacity),
        isExclusion ? '' : formatOptionalNumber(item.updatedQuota),
      ];
    }),
  ];

  return {
    table: {
      headerRows: 1,
      widths: [42, '*', 50, 45, 50, 55, 30, 50, 50, 55, 50, 50],
      body: tableBody,
    },
    layout: 'lightHorizontalLines',
  };
}

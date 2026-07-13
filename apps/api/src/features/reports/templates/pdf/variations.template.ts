import { Content } from 'pdfmake/interfaces';

export interface VariationReportRow {
  cedula: string;
  fullname: string;
  workerType: string | null;
  payrollCode: string | null;
  totalPayable: string | null;
  termUnits: number | null;
  installmentNumber: number;
  principalBalancePending: string | null;
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

export function buildVariationsTableContent(data: VariationReportRow[]): Content {
  const tableBody = [
    [
      { text: 'CÉDULA', style: 'tableHeader' },
      { text: 'NOMBRE Y APELLIDOS', style: 'tableHeader' },
      { text: 'TIPO PERSONAL', style: 'tableHeader' },
      { text: 'TIPO PTMO', style: 'tableHeader' },
      { text: 'MONTO PRÉSTAMO', style: 'tableHeader' },
      { text: 'CANT. CUOTAS', style: 'tableHeader' },
      { text: 'MONTO CUOTA', style: 'tableHeader' },
      { text: '', style: 'tableHeader' },
    ],
    ...data.map((item) => {
      const isExclusion =
        item.termUnits !== null &&
        item.installmentNumber >= item.termUnits;
      return [
        item.cedula,
        item.fullname,
        item.workerType ?? 'N/A',
        item.payrollCode ?? 'N/A',
        formatAmount(item.totalPayable),
        item.termUnits?.toString() ?? 'N/A',
        formatAmount(item.principalBalancePending),
        isExclusion ? 'EXCLUSION' : 'INCLUSION',
      ];
    }),
  ];

  return {
    table: {
      headerRows: 1,
      widths: [50, '*', 55, 45, 55, 35, 55, 50],
      body: tableBody,
    },
    layout: 'lightHorizontalLines',
  };
}

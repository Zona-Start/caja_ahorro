import { Content } from 'pdfmake/interfaces';

export interface HaberesReportRow {
  entryDate: string | null;
  type: string;
  movementType: string;
  description: string | null;
  totalAmount: string;
  associateCount: number;
  batchStatus: string;
  associateFullname: string | null;
  associateCedula: string | null;
  associateAmount: string | null;
}

const TYPE_MAP: Record<string, string> = {
  individual: 'Individual',
  massive: 'Masiva',
};

const MOVEMENT_MAP: Record<string, string> = {
  contribution_patronal: 'Aporte Patronal',
  contribution_voluntary: 'Aporte Voluntario',
};

const STATUS_MAP: Record<string, string> = {
  completed: 'Completado',
  reversed: 'Reversado',
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

export function buildHaberesTableContent(data: HaberesReportRow[]): Content {
  const tableBody = [
    [
      { text: 'Fecha', style: 'tableHeader' },
      { text: 'Tipo', style: 'tableHeader' },
      { text: 'Movimiento', style: 'tableHeader' },
      { text: 'Descripción', style: 'tableHeader' },
      { text: 'Total Lote', style: 'tableHeader' },
      { text: 'Asociado', style: 'tableHeader' },
      { text: 'Cédula', style: 'tableHeader' },
      { text: 'Monto', style: 'tableHeader' },
    ],
    ...data.map((item) => {
      const entryDate = formatDate(item.entryDate);
      return [
        entryDate,
        translate(item.type, TYPE_MAP),
        translate(item.movementType, MOVEMENT_MAP),
        item.description ?? 'N/A',
        formatAmount(item.totalAmount),
        item.associateFullname ?? 'N/A',
        item.associateCedula ?? 'N/A',
        formatAmount(item.associateAmount),
      ];
    }),
  ];

  return {
    table: {
      headerRows: 1,
      widths: [55, 50, 65, '*', 55, '*', 55, 55],
      body: tableBody,
    },
    layout: 'lightHorizontalLines',
  };
}

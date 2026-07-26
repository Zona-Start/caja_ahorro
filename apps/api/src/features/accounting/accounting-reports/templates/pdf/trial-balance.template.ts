import { Content } from 'pdfmake/interfaces';

export interface TrialBalanceAccountRow {
  accountPlanId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  accountNature: string;
  level: number;
  initialBalance: string;
  periodDebit: string;
  periodCredit: string;
  currentBalance: string;
}

export interface TrialBalanceData {
  accounts: TrialBalanceAccountRow[];
  summary: {
    totalInitialDebit: string;
    totalInitialCredit: string;
    totalPeriodDebit: string;
    totalPeriodCredit: string;
    totalCurrentDebit: string;
    totalCurrentCredit: string;
  };
  cycleInfo?: {
    cycleId: string;
    description: string;
    startDate: string;
    endDate: string;
    status: string;
  } | null;
}

function fmt(value: string): string {
  const n = Number(value);
  if (isNaN(n)) return value;
  return n.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function indent(level: number): string {
  return '  '.repeat(Math.max(0, level - 1));
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    ASSET: 'Activo',
    LIABILITY: 'Pasivo',
    EQUITY: 'Patrimonio',
    REVENUE: 'Ingreso',
    EXPENSE: 'Gasto',
    MEMORANDUM: 'Memorándum',
  };
  return map[type] || type;
}

export function buildTrialBalanceTableContent(
  data: TrialBalanceData,
): Content {
  const rows = data.accounts.map((a) => [
    a.accountCode,
    indent(a.level) + a.accountName,
    typeLabel(a.accountType),
    a.accountNature === 'DEBIT' ? 'Deudora' : 'Acreedora',
    { text: fmt(a.initialBalance), alignment: 'right' },
    { text: fmt(a.periodDebit), alignment: 'right' },
    { text: fmt(a.periodCredit), alignment: 'right' },
    { text: fmt(a.currentBalance), alignment: 'right' },
  ]);

  const content: any[] = [
    {
      table: {
        headerRows: 1,
        widths: [55, '*', 45, 42, 65, 65, 65, 65],
        body: [
          [
            { text: 'Código', style: 'tableHeader' },
            { text: 'Cuenta', style: 'tableHeader' },
            { text: 'Tipo', style: 'tableHeader' },
            { text: 'Nat.', style: 'tableHeader' },
            { text: 'S. Inicial', style: 'tableHeader', alignment: 'right' },
            { text: 'Debe Per.', style: 'tableHeader', alignment: 'right' },
            { text: 'Haber Per.', style: 'tableHeader', alignment: 'right' },
            { text: 'S. Actual', style: 'tableHeader', alignment: 'right' },
          ],
          ...rows,
        ],
      },
      layout: 'lightHorizontalLines',
    },
    {
      margin: [0, 12, 0, 0],
      table: {
        widths: ['*', 80, 80, 80],
        body: [
          [
            { text: 'RESUMEN', style: 'tableHeader', colSpan: 4 },
            {},
            {},
            {},
          ],
          [
            '',
            { text: 'Débitos', style: 'tableHeader', alignment: 'right' },
            { text: 'Créditos', style: 'tableHeader', alignment: 'right' },
            { text: 'Diferencia', style: 'tableHeader', alignment: 'right' },
          ],
          [
            'Saldos Iniciales',
            { text: fmt(data.summary.totalInitialDebit), alignment: 'right' },
            { text: fmt(data.summary.totalInitialCredit), alignment: 'right' },
            {
              text: fmt(
                (
                  parseFloat(data.summary.totalInitialDebit) -
                  parseFloat(data.summary.totalInitialCredit)
                ).toFixed(2),
              ),
              alignment: 'right',
            },
          ],
          [
            'Mov. Periodo',
            { text: fmt(data.summary.totalPeriodDebit), alignment: 'right' },
            { text: fmt(data.summary.totalPeriodCredit), alignment: 'right' },
            {
              text: fmt(
                (
                  parseFloat(data.summary.totalPeriodDebit) -
                  parseFloat(data.summary.totalPeriodCredit)
                ).toFixed(2),
              ),
              alignment: 'right',
            },
          ],
          [
            { text: 'Saldos Actuales', bold: true },
            { text: fmt(data.summary.totalCurrentDebit), alignment: 'right', bold: true },
            { text: fmt(data.summary.totalCurrentCredit), alignment: 'right', bold: true },
            {
              text: fmt(
                (
                  parseFloat(data.summary.totalCurrentDebit) -
                  parseFloat(data.summary.totalCurrentCredit)
                ).toFixed(2),
              ),
              alignment: 'right',
              bold: true,
            },
          ],
        ],
      },
      layout: 'lightHorizontalLines',
    },
  ];

  return content as Content;
}

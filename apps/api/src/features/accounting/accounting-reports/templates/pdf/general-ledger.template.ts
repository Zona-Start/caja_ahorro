import { Content } from 'pdfmake/interfaces';

export interface GeneralLedgerEntryRow {
  entryId: string;
  entryDate: string;
  description: string;
  originType: string | null;
  debit: string;
  credit: string;
  balance: string;
}

export interface GeneralLedgerAccountRow {
  accountPlanId: string;
  accountCode: string;
  accountName: string;
  accountNature: string;
  initialBalance: string;
  totalDebit: string;
  totalCredit: string;
  finalBalance: string;
  entries: GeneralLedgerEntryRow[];
}

function fmt(value: string): string {
  const n = Number(value);
  if (isNaN(n)) return value;
  return n.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtDate(value: string): string {
  if (!value) return '';
  const [y, m, d] = value.split('-');
  if (!y) return value;
  return `${d}/${m}/${y}`;
}

export function buildGeneralLedgerTableContent(
  data: GeneralLedgerAccountRow[],
): Content {
  const content: any[] = [];

  for (const account of data) {
    const rows = account.entries.map((e) => [
      fmtDate(e.entryDate),
      e.description,
      { text: fmt(e.debit), alignment: 'right' },
      { text: fmt(e.credit), alignment: 'right' },
      { text: fmt(e.balance), alignment: 'right' },
    ]);

    content.push({
      stack: [
        {
          columns: [
            {
              text: `${account.accountCode} - ${account.accountName}`,
              bold: true,
              fontSize: 10,
            },
            {
              text: `Saldo Inicial: ${fmt(account.initialBalance)}`,
              alignment: 'right',
              fontSize: 9,
            },
          ],
          margin: [0, 8, 0, 4],
        },
        {
          table: {
            headerRows: 1,
            widths: [60, '*', 70, 70, 70],
            body: [
              [
                { text: 'Fecha', style: 'tableHeader' },
                { text: 'Descripción', style: 'tableHeader' },
                { text: 'Debe', style: 'tableHeader', alignment: 'right' },
                { text: 'Haber', style: 'tableHeader', alignment: 'right' },
                { text: 'Saldo', style: 'tableHeader', alignment: 'right' },
              ],
              ...rows,
              [
                { text: 'TOTALES', bold: true, colSpan: 2 },
                {},
                { text: fmt(account.totalDebit), bold: true, alignment: 'right' },
                { text: fmt(account.totalCredit), bold: true, alignment: 'right' },
                { text: fmt(account.finalBalance), bold: true, alignment: 'right' },
              ],
            ],
          },
          layout: 'lightHorizontalLines',
        },
      ],
    });
  }

  return content as Content;
}

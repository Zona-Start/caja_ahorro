import { Content } from 'pdfmake/interfaces';

export interface JournalBookDetailRow {
  detailId: string;
  accountCode: string;
  accountName: string;
  description: string | null;
  debit: string;
  credit: string;
}

export interface JournalBookEntryRow {
  entryId: string;
  voucherNo?: string;
  entryDate: string;
  description: string;
  originType: string | null;
  originReferenceId: string | null;
  status: string;
  details: JournalBookDetailRow[];
  totalDebit: string;
  totalCredit: string;
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

export function buildJournalBookTableContent(
  data: JournalBookEntryRow[],
): Content {
  const content: any[] = [];

  for (const entry of data) {
    const detailBody = entry.details.map((d) => [
      `${d.accountCode} - ${d.accountName}`,
      d.description || '',
      { text: fmt(d.debit), alignment: 'right' },
      { text: fmt(d.credit), alignment: 'right' },
    ]);

    content.push({
      stack: [
        {
          text: `${fmtDate(entry.entryDate)} - #${entry.voucherNo ?? entry.entryId.slice(0, 8)} - ${entry.description}`,
          style: 'tableHeader',
          margin: [0, 8, 0, 4],
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 70, 70],
            body: [
              [
                { text: 'Cuenta', style: 'tableHeader' },
                { text: 'Descripción', style: 'tableHeader' },
                { text: 'Debe', style: 'tableHeader', alignment: 'right' },
                { text: 'Haber', style: 'tableHeader', alignment: 'right' },
              ],
              ...detailBody,
              [
                { text: 'TOTALES', bold: true, colSpan: 2 },
                {},
                { text: fmt(entry.totalDebit), bold: true, alignment: 'right' },
                { text: fmt(entry.totalCredit), bold: true, alignment: 'right' },
              ],
            ],
          },
          layout: 'lightHorizontalLines',
        },
      ],
      margin: [0, 0, 0, 8],
    });
  }

  return content as Content;
}

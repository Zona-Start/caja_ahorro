import { Content } from 'pdfmake/interfaces';
import type { SudecaReportType } from '../../dto/sudeca.dto';
import type { SudecaRow } from '../../services/sudeca.service';

function fmt(value?: string): string {
  if (value === undefined || value === null || value === '') return '';
  const n = Number(value);
  if (isNaN(n)) return value;
  return n.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function buildSudecaTableContent(
  type: SudecaReportType,
  rows: SudecaRow[],
): Content {
  const isTrialBalance = type === 'trial-balance';

  const header = isTrialBalance
    ? [
        { text: 'Código', style: 'tableHeader' },
        { text: 'Descripción de la cuenta', style: 'tableHeader' },
        { text: 'Anterior', style: 'tableHeader', alignment: 'right' },
        { text: 'Débitos', style: 'tableHeader', alignment: 'right' },
        { text: 'Créditos', style: 'tableHeader', alignment: 'right' },
        { text: 'Actual', style: 'tableHeader', alignment: 'right' },
      ]
    : [
        { text: 'Código', style: 'tableHeader' },
        { text: 'Descripción de la cuenta', style: 'tableHeader' },
        {
          text: 'Trimestre Anterior',
          style: 'tableHeader',
          alignment: 'right',
        },
        { text: 'Trimestre Actual', style: 'tableHeader', alignment: 'right' },
        { text: 'Variación', style: 'tableHeader', alignment: 'right' },
      ];

  const body = rows.map((row) =>
    isTrialBalance
      ? [
          row.accountCode,
          row.accountName,
          { text: fmt(row.previous), alignment: 'right' },
          { text: fmt(row.debit), alignment: 'right' },
          { text: fmt(row.credit), alignment: 'right' },
          { text: fmt(row.current), alignment: 'right' },
        ]
      : [
          row.accountCode,
          row.accountName,
          { text: fmt(row.previous), alignment: 'right' },
          { text: fmt(row.current), alignment: 'right' },
          { text: fmt(row.variation), alignment: 'right' },
        ],
  );

  return {
    table: {
      headerRows: 1,
      widths: isTrialBalance
        ? [70, '*', 70, 70, 70, 70]
        : [70, '*', 80, 80, 80],
      body: [header, ...body],
    },
    layout: 'lightHorizontalLines',
  } as Content;
}

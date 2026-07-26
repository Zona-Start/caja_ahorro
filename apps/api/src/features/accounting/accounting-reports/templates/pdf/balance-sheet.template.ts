import { Content } from 'pdfmake/interfaces';

interface AccountNode {
  accountPlanId: string;
  accountCode: string;
  accountName: string;
  level: number;
  balance: string;
  children?: AccountNode[];
}

interface Section {
  title: string;
  accounts: AccountNode[];
  total: string;
}

interface BalanceSheetData {
  assets: Section;
  liabilities: Section;
  equity: Section;
  totals: {
    totalAssets: string;
    totalLiabilities: string;
    totalEquity: string;
    totalLiabilitiesAndEquity: string;
  };
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

function flattenAccounts(
  accounts: AccountNode[],
  level = 0,
): { text: string; balance: string; isBold: boolean }[] {
  const result: { text: string; balance: string; isBold: boolean }[] = [];
  for (const a of accounts) {
    result.push({
      text: indent(a.level) + `${a.accountCode} ${a.accountName}`,
      balance: fmt(a.balance),
      isBold: a.level <= 2,
    });
    if (a.children && a.children.length > 0) {
      result.push(...flattenAccounts(a.children, level + 1));
    }
  }
  return result;
}

export function buildBalanceSheetTableContent(
  data: BalanceSheetData,
): Content {
  const leftRows: any[] = [];
  const rightTopRows: any[] = [];
  const rightBottomRows: any[] = [];

  for (const a of flattenAccounts(data.assets.accounts)) {
    leftRows.push([
      { text: a.text, bold: a.isBold },
      { text: a.balance, alignment: 'right', bold: a.isBold },
    ]);
  }
  leftRows.push([
    { text: 'TOTAL ACTIVOS', bold: true },
    { text: fmt(data.totals.totalAssets), alignment: 'right', bold: true },
  ]);

  for (const a of flattenAccounts(data.liabilities.accounts)) {
    rightTopRows.push([
      { text: a.text, bold: a.isBold },
      { text: a.balance, alignment: 'right', bold: a.isBold },
    ]);
  }
  rightTopRows.push([
    { text: 'TOTAL PASIVOS', bold: true },
    { text: fmt(data.totals.totalLiabilities), alignment: 'right', bold: true },
  ]);

  for (const a of flattenAccounts(data.equity.accounts)) {
    rightBottomRows.push([
      { text: a.text, bold: a.isBold },
      { text: a.balance, alignment: 'right', bold: a.isBold },
    ]);
  }
  rightBottomRows.push([
    { text: 'TOTAL PATRIMONIO', bold: true },
    { text: fmt(data.totals.totalEquity), alignment: 'right', bold: true },
  ]);

  return [
    {
      columns: [
        {
          width: '50%',
          stack: [
            { text: 'ACTIVOS', style: 'tableHeader', margin: [0, 0, 0, 4] },
            {
              table: {
                widths: ['*', 70],
                body: [
                  [
                    { text: 'Cuenta', style: 'tableHeader' },
                    { text: 'Monto', style: 'tableHeader', alignment: 'right' },
                  ],
                  ...leftRows,
                ],
              },
              layout: 'lightHorizontalLines',
            },
          ],
        },
        {
          width: '50%',
          stack: [
            { text: 'PASIVOS', style: 'tableHeader', margin: [8, 0, 0, 4] },
            {
              table: {
                widths: ['*', 70],
                body: [
                  [
                    { text: 'Cuenta', style: 'tableHeader' },
                    { text: 'Monto', style: 'tableHeader', alignment: 'right' },
                  ],
                  ...rightTopRows,
                ],
              },
              layout: 'lightHorizontalLines',
              margin: [8, 0, 0, 8],
            },
            { text: 'PATRIMONIO', style: 'tableHeader', margin: [8, 0, 0, 4] },
            {
              table: {
                widths: ['*', 70],
                body: [
                  [
                    { text: 'Cuenta', style: 'tableHeader' },
                    { text: 'Monto', style: 'tableHeader', alignment: 'right' },
                  ],
                  ...rightBottomRows,
                  [
                    {
                      text: 'TOTAL PASIVO + PATRIMONIO',
                      bold: true,
                    },
                    {
                      text: fmt(data.totals.totalLiabilitiesAndEquity),
                      alignment: 'right',
                      bold: true,
                    },
                  ],
                ],
              },
              layout: 'lightHorizontalLines',
              margin: [8, 0, 0, 0],
            },
          ],
        },
      ],
    },
  ];
}

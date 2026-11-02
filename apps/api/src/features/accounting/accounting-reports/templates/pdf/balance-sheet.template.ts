import { Content } from 'pdfmake/interfaces';

interface AccountNode {
  id: string;
  code: string;
  name: string;
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
): {
  code: string;
  name: string;
  level: number;
  balance: string;
  isBold: boolean;
}[] {
  const result: {
    code: string;
    name: string;
    level: number;
    balance: string;
    isBold: boolean;
  }[] = [];
  for (const a of accounts) {
    result.push({
      code: a.code,
      name: a.name,
      level: a.level,
      balance: fmt(a.balance),
      isBold: a.level <= 2,
    });
    if (a.children && a.children.length > 0) {
      result.push(...flattenAccounts(a.children, level + 1));
    }
  }
  return result;
}

export function buildBalanceSheetTableContent(data: BalanceSheetData): Content {
  const buildSection = (
    title: string,
    accounts: AccountNode[],
    totalLabel: string,
    total: string,
  ) => {
    const rows = flattenAccounts(accounts).map((a) => [
      { text: a.code, bold: a.isBold },
      { text: indent(a.level) + a.name, bold: a.isBold },
      { text: a.balance, alignment: 'right', bold: a.isBold },
    ]);

    return {
      stack: [
        {
          text: title,
          bold: true,
          fontSize: 11,
          margin: [0, 0, 0, 4],
        },
        {
          table: {
            headerRows: 1,
            widths: [80, '*', 90],
            body: [
              [
                { text: 'Código', style: 'tableHeader' },
                { text: 'Cuenta', style: 'tableHeader' },
                { text: 'Monto', style: 'tableHeader', alignment: 'right' },
              ],
              ...rows,
              [
                { text: totalLabel, bold: true, colSpan: 2 },
                {},
                { text: fmt(total), alignment: 'right', bold: true },
              ],
            ],
          },
          layout: 'lightHorizontalLines',
        },
      ],
      margin: [0, 0, 0, 14],
    };
  };

  const content: any[] = [
    buildSection(
      'ACTIVOS',
      data.assets.accounts,
      'TOTAL ACTIVOS',
      data.totals.totalAssets,
    ),
    buildSection(
      'PASIVOS',
      data.liabilities.accounts,
      'TOTAL PASIVOS',
      data.totals.totalLiabilities,
    ),
    buildSection(
      'PATRIMONIO',
      data.equity.accounts,
      'TOTAL PATRIMONIO',
      data.totals.totalEquity,
    ),
    {
      columns: [
        { text: 'TOTAL PASIVO + PATRIMONIO', bold: true },
        {
          text: fmt(data.totals.totalLiabilitiesAndEquity),
          alignment: 'right',
          bold: true,
        },
      ],
      margin: [0, 4, 0, 0],
    },
  ];

  return content as Content;
}

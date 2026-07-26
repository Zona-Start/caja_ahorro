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

interface IncomeStatementData {
  revenue: Section;
  expenses: Section;
  result: {
    grossProfit: string;
    operatingIncome: string;
    netIncome: string;
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
): { text: string; balance: string; isBold: boolean }[] {
  const result: { text: string; balance: string; isBold: boolean }[] = [];
  for (const a of accounts) {
    result.push({
      text: indent(a.level) + `${a.accountCode} ${a.accountName}`,
      balance: fmt(a.balance),
      isBold: a.level <= 2,
    });
    if (a.children && a.children.length > 0) {
      result.push(...flattenAccounts(a.children));
    }
  }
  return result;
}

export function buildIncomeStatementTableContent(
  data: IncomeStatementData,
): Content {
  const revenueRows = flattenAccounts(data.revenue.accounts);
  const expenseRows = flattenAccounts(data.expenses.accounts);

  const allRevenueRows: any[] = revenueRows.map((a) => [
    { text: a.text, bold: a.isBold },
    { text: a.balance, alignment: 'right', bold: a.isBold },
  ]);

  const allExpenseRows: any[] = expenseRows.map((a) => [
    { text: a.text, bold: a.isBold },
    { text: a.balance, alignment: 'right', bold: a.isBold },
  ]);

  return [
    { text: 'INGRESOS', style: 'tableHeader', margin: [0, 0, 0, 4] },
    {
      table: {
        widths: ['*', 70],
        body: [
          [
            { text: 'Cuenta', style: 'tableHeader' },
            { text: 'Monto', style: 'tableHeader', alignment: 'right' },
          ],
          ...allRevenueRows,
          [
            { text: 'TOTAL INGRESOS', bold: true },
            { text: fmt(data.revenue.total), alignment: 'right', bold: true },
          ],
        ],
      },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 12],
    },
    { text: 'EGRESOS', style: 'tableHeader', margin: [0, 0, 0, 4] },
    {
      table: {
        widths: ['*', 70],
        body: [
          [
            { text: 'Cuenta', style: 'tableHeader' },
            { text: 'Monto', style: 'tableHeader', alignment: 'right' },
          ],
          ...allExpenseRows,
          [
            { text: 'TOTAL EGRESOS', bold: true },
            { text: fmt(data.expenses.total), alignment: 'right', bold: true },
          ],
        ],
      },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 12],
    },
    {
      margin: [0, 16, 0, 0],
      table: {
        widths: ['*', 70],
        body: [
          [
            {
              text: 'UTILIDAD / PÉRDIDA DEL EJERCICIO',
              style: 'tableHeader',
              colSpan: 2,
            },
            {},
          ],
          [
            'Resultado Neto',
            { text: fmt(data.result.netIncome), alignment: 'right', bold: true },
          ],
        ],
      },
      layout: 'lightHorizontalLines',
    },
  ];
}

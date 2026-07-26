import { Content } from 'pdfmake/interfaces';

interface AssociateAccount {
  accountPlanId: string;
  accountCode: string;
  accountName: string;
  accountNature: string;
  totalDebit: string;
  totalCredit: string;
  balance: string;
}

interface AssociateRow {
  associateId: string;
  cedula: string;
  fullname: string;
  accounts: AssociateAccount[];
  totalBalance: string;
}

function fmt(value: string): string {
  const n = Number(value);
  if (isNaN(n)) return value;
  return n.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function buildAssociatesBalanceTableContent(
  data: AssociateRow[],
): Content {
  const content: any[] = [];

  for (const assoc of data) {
    const accountRows = assoc.accounts.map((a) => [
      a.accountCode,
      a.accountName,
      { text: fmt(a.totalDebit), alignment: 'right' },
      { text: fmt(a.totalCredit), alignment: 'right' },
      { text: fmt(a.balance), alignment: 'right' },
    ]);

    content.push({
      stack: [
        {
          columns: [
            {
              text: `${assoc.cedula} - ${assoc.fullname}`,
              bold: true,
              fontSize: 10,
            },
            {
              text: `Balance Total: ${fmt(assoc.totalBalance)}`,
              alignment: 'right',
              fontSize: 9,
            },
          ],
          margin: [0, 8, 0, 4],
        },
        {
          table: {
            headerRows: 1,
            widths: [55, '*', 65, 65, 65],
            body: [
              [
                { text: 'Código', style: 'tableHeader' },
                { text: 'Cuenta', style: 'tableHeader' },
                { text: 'Debe', style: 'tableHeader', alignment: 'right' },
                { text: 'Haber', style: 'tableHeader', alignment: 'right' },
                { text: 'Saldo', style: 'tableHeader', alignment: 'right' },
              ],
              ...accountRows,
            ],
          },
          layout: 'lightHorizontalLines',
        },
      ],
      margin: [0, 0, 0, 12],
    });
  }

  if (data.length === 0) {
    content.push({
      text: 'No se encontraron movimientos para los filtros seleccionados.',
      alignment: 'center',
      margin: [0, 20],
      color: '#999',
    });
  }

  return content as Content;
}

import { Content } from 'pdfmake/interfaces';

function fmt(value: string): string {
  const n = Number(value);
  if (isNaN(n)) return value;
  return n.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface AccountBalanceData {
  account: {
    accountCode: string;
    accountName: string;
    accountNature: string;
    hasAssociateAuxiliary: boolean;
    totalDebit: string;
    totalCredit: string;
    balance: string;
  };
  associates: {
    cedula: string;
    fullname: string;
    totalDebit: string;
    totalCredit: string;
    balance: string;
  }[];
  associatesTotal: {
    totalDebit: string;
    totalCredit: string;
    balance: string;
  };
}

export function buildAccountBalanceTableContent(
  data: AccountBalanceData,
): Content {
  const { account, associates, associatesTotal } = data;
  const content: any[] = [];

  content.push({
    columns: [
      {
        text: `${account.accountCode} - ${account.accountName}`,
        bold: true,
        fontSize: 11,
      },
      {
        text: `Naturaleza: ${account.accountNature}`,
        alignment: 'right',
        fontSize: 9,
      },
    ],
    margin: [0, 0, 0, 6],
  });

  content.push({
    table: {
      widths: ['*', 100, 100, 100],
      body: [
        [
          { text: 'Resumen de la cuenta', style: 'tableHeader' },
          { text: 'Debe', style: 'tableHeader', alignment: 'right' },
          { text: 'Haber', style: 'tableHeader', alignment: 'right' },
          { text: 'Saldo', style: 'tableHeader', alignment: 'right' },
        ],
        [
          { text: 'Total de la cuenta', bold: true },
          { text: fmt(account.totalDebit), alignment: 'right' },
          { text: fmt(account.totalCredit), alignment: 'right' },
          { text: fmt(account.balance), alignment: 'right', bold: true },
        ],
      ],
    },
    layout: 'lightHorizontalLines',
    margin: [0, 0, 0, 12],
  });

  if (account.hasAssociateAuxiliary) {
    const body: any[] = [
      [
        { text: 'Cédula', style: 'tableHeader' },
        { text: 'Asociado', style: 'tableHeader' },
        { text: 'Debe', style: 'tableHeader', alignment: 'right' },
        { text: 'Haber', style: 'tableHeader', alignment: 'right' },
        { text: 'Saldo', style: 'tableHeader', alignment: 'right' },
      ],
    ];

    for (const a of associates) {
      body.push([
        a.cedula,
        a.fullname,
        { text: fmt(a.totalDebit), alignment: 'right' },
        { text: fmt(a.totalCredit), alignment: 'right' },
        { text: fmt(a.balance), alignment: 'right' },
      ]);
    }

    body.push([
      { text: 'Totales', bold: true, colSpan: 2 },
      {},
      {
        text: fmt(associatesTotal.totalDebit),
        alignment: 'right',
        bold: true,
      },
      {
        text: fmt(associatesTotal.totalCredit),
        alignment: 'right',
        bold: true,
      },
      {
        text: fmt(associatesTotal.balance),
        alignment: 'right',
        bold: true,
      },
    ]);

    content.push({
      table: {
        headerRows: 1,
        widths: [60, '*', 80, 80, 80],
        body,
      },
      layout: 'lightHorizontalLines',
    });
  } else {
    content.push({
      text: 'La cuenta no tiene auxiliar por socio.',
      alignment: 'center',
      margin: [0, 12],
      color: '#666666',
    });
  }

  return content as Content;
}

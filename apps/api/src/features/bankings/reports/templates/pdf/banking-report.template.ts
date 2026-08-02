import { Content } from 'pdfmake/interfaces';

function fmtDate(v: string | null): string {
  if (!v) return '-';
  const [y, m, d] = v.split('-');
  return `${d}/${m}/${y}`;
}

export function buildReconciliationActTable(data: any): Content {
  const r = data.reconciliation;
  const lines = data.statementLines || [];
  const txns = data.matchedTransactions || [];

  return [
    { text: `Cuenta: ${data.bankAccount?.accountName || ''} - ${data.bankAccount?.accountNumber || ''}`, margin: [0, 0, 0, 4] },
    { text: `Fecha Corte: ${fmtDate(r?.statementDate)} | Estado: ${r?.status}`, margin: [0, 0, 0, 10] },

    {
      layout: 'lightHorizontalLines',
      table: {
        widths: ['*', '*'],
        body: [
          ['Saldo según Extracto', Number(r?.statementEndingBalance || 0).toFixed(2)],
          ['Saldo según Libros (Antes)', Number(r?.bookBalanceBefore || 0).toFixed(2)],
          ['Saldo según Libros (Después)', Number(r?.bookBalanceAfter || 0).toFixed(2)],
          ['Diferencia', Number(r?.difference || 0).toFixed(2)],
        ],
      },
      margin: [0, 0, 0, 16],
    },

    { text: `Líneas del Extracto (${lines.length})`, bold: true, margin: [0, 8, 0, 4] },
    {
      layout: 'lightHorizontalLines',
      table: {
        headerRows: 1,
        widths: [60, '*', 60, 60, 60],
        body: [
          ['Fecha', 'Descripción', 'Ref', 'Débito', 'Crédito'],
          ...lines.map((l: any) => [
            fmtDate(l.transactionDate),
            l.description || '',
            l.bankReference || '',
            Number(l.debitAmount) > 0 ? Number(l.debitAmount).toFixed(2) : '',
            Number(l.creditAmount) > 0 ? Number(l.creditAmount).toFixed(2) : '',
          ]),
        ],
      },
      margin: [0, 0, 0, 16],
    },

    { text: `Transacciones Conciliadas (${txns.length})`, bold: true, margin: [0, 8, 0, 4] },
    {
      layout: 'lightHorizontalLines',
      table: {
        headerRows: 1,
        widths: [60, '*', 60, 60, 60],
        body: [
          ['Fecha', 'Descripción', 'Código', 'Débito', 'Crédito'],
          ...txns.map((t: any) => [
            fmtDate(t.transactionDate),
            t.description || '',
            t.internalCode || '',
            Number(t.debitAmount) > 0 ? Number(t.debitAmount).toFixed(2) : '',
            Number(t.creditAmount) > 0 ? Number(t.creditAmount).toFixed(2) : '',
          ]),
        ],
      },
    },
  ];
}

export function buildPendingItemsTable(data: any): Content {
  const items = data.items || [];
  return [
    { text: `Partidas con más de ${data.daysThreshold} días sin conciliar (${data.count})`, margin: [0, 0, 0, 10] },
    {
      layout: 'lightHorizontalLines',
      table: {
        headerRows: 1,
        widths: [80, 50, '*', 60, 60, 60, 40],
        body: [
          ['Código', 'Fecha', 'Descripción', 'Ref', 'Débito', 'Crédito', 'Días'],
          ...items.map((t: any) => {
            const age = Math.floor((Date.now() - new Date(t.transactionDate).getTime()) / 86400000);
            return [
              t.internalCode || '',
              fmtDate(t.transactionDate),
              t.description || '',
              t.bankReference || '',
              Number(t.debitAmount) > 0 ? Number(t.debitAmount).toFixed(2) : '',
              Number(t.creditAmount) > 0 ? Number(t.creditAmount).toFixed(2) : '',
              String(age),
            ];
          }),
        ],
      },
    },
  ];
}

export function buildConsolidatedPositionTable(data: any): Content {
  const accounts = data.accounts || [];
  return [
    { text: `Total de cuentas activas: ${data.total}`, margin: [0, 0, 0, 10] },
    {
      layout: 'lightHorizontalLines',
      table: {
        headerRows: 1,
        widths: ['*', 80, 50, 70, 70, 50],
        body: [
          ['Cuenta', 'Número', 'Moneda', 'Saldo Libros', 'Último Extracto', 'Pendientes'],
          ...accounts.map((a: any) => [
            a.accountName || '',
            a.accountNumber,
            a.currencyCode,
            Number(a.bookBalance).toFixed(2),
            Number(a.lastStatementBalance || 0).toFixed(2),
            String(a.pendingReconciliation),
          ]),
        ],
      },
    },
  ];
}

export function buildAuxiliaryBookTable(data: any): Content {
  const txns = data.transactions || [];
  return [
    { text: `Cuenta: ${data.bankAccount?.accountName || ''} - ${data.bankAccount?.accountNumber || ''}`, margin: [0, 0, 0, 4] },
    { text: `Total movimientos: ${data.total}`, margin: [0, 0, 0, 10] },
    {
      layout: 'lightHorizontalLines',
      table: {
        headerRows: 1,
        widths: [80, 50, '*', 60, 60, 60, 50],
        body: [
          ['Código', 'Fecha', 'Descripción', 'Ref', 'Débito', 'Crédito', 'Conciliado'],
          ...txns.map((t: any) => [
            t.internalCode || '',
            fmtDate(t.transactionDate),
            t.description || '',
            t.bankReference || '',
            Number(t.debitAmount) > 0 ? Number(t.debitAmount).toFixed(2) : '',
            Number(t.creditAmount) > 0 ? Number(t.creditAmount).toFixed(2) : '',
            t.reconciliationStatus === 'RECONCILED' ? 'Sí' : 'No',
          ]),
        ],
      },
    },
  ];
}

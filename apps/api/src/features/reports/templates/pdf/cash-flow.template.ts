import { Content } from 'pdfmake/interfaces';

function fmt(n: number): string {
  return (n || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function buildCashFlowTableContent(data: { period: string; totalAmount: number; count: number }[], groupBy: 'week' | 'month'): Content {
  const formatPeriod = (d: string) => {
    if (!d) return '—';
    const date = new Date(d);
    if (groupBy === 'week') {
      const end = new Date(date);
      end.setDate(end.getDate() + 6);
      return `Sem ${new Date(date).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit' })} - ${end.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    }
    return date.toLocaleDateString('es-VE', { month: 'long', year: 'numeric' });
  };

  const body = [
    [
      { text: 'Período', style: 'tableHeader' },
      { text: 'Cantidad CxP', style: 'tableHeader', alignment: 'right' },
      { text: 'Total a Pagar', style: 'tableHeader', alignment: 'right' },
    ],
    ...data.map((r) => [
      formatPeriod(r.period),
      { text: String(r.count), alignment: 'right' },
      { text: fmt(r.totalAmount), alignment: 'right' },
    ]),
    [
      { text: 'TOTAL', bold: true },
      { text: String(data.reduce((s: number, r) => s + Number(r.count || 0), 0)), alignment: 'right', bold: true },
      { text: fmt(data.reduce((s: number, r) => s + Number(r.totalAmount || 0), 0)), alignment: 'right', bold: true },
    ],
  ];

  return { table: { headerRows: 1, widths: ['*', 70, 100], body }, layout: 'lightHorizontalLines' } as unknown as Content;
}

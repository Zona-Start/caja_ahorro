import { Content } from 'pdfmake/interfaces';

function fmt(n: number): string {
  return n > 0 ? n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';
}

export function buildAgingTableContent(data: { supplierName: string; totalDue: number; bucket0: number; bucket1to30: number; bucket31to60: number; bucket61to90: number; bucket90plus: number }[]): Content {
  const body = [
    [
      { text: 'Proveedor', style: 'tableHeader' },
      { text: 'Total Deuda', style: 'tableHeader', alignment: 'right' },
      { text: 'Por Vencer', style: 'tableHeader', alignment: 'right' },
      { text: '1-30 Días', style: 'tableHeader', alignment: 'right' },
      { text: '31-60 Días', style: 'tableHeader', alignment: 'right' },
      { text: '61-90 Días', style: 'tableHeader', alignment: 'right' },
      { text: '+90 Días', style: 'tableHeader', alignment: 'right' },
    ],
    ...data.map((r) => [
      r.supplierName,
      { text: fmt(r.totalDue), alignment: 'right' },
      { text: fmt(r.bucket0), alignment: 'right' },
      { text: fmt(r.bucket1to30), alignment: 'right' },
      { text: fmt(r.bucket31to60), alignment: 'right' },
      { text: fmt(r.bucket61to90), alignment: 'right' },
      { text: fmt(r.bucket90plus), alignment: 'right', bold: r.bucket90plus > 0 },
    ]),
  ];

  return { table: { headerRows: 1, widths: ['*', 65, 60, 55, 55, 55, 55], body }, layout: 'lightHorizontalLines' } as unknown as Content;
}

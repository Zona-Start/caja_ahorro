import { Content } from 'pdfmake/interfaces';

function fmt(n: number): string {
  return (n || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function buildTaxBookTableContent(data: { date: string; supplierTaxId: string; supplierName: string; invoiceNumber: string; controlNumber: string; subtotal: string; taxAmount: string; totalAmount: string }[]): Content {
  const body = [
    [
      { text: 'Fecha', style: 'tableHeader' },
      { text: 'RIF', style: 'tableHeader' },
      { text: 'Proveedor', style: 'tableHeader' },
      { text: 'N° Factura', style: 'tableHeader' },
      { text: 'N° Control', style: 'tableHeader' },
      { text: 'Base Imponible', style: 'tableHeader', alignment: 'right' },
      { text: 'IVA', style: 'tableHeader', alignment: 'right' },
      { text: 'Total', style: 'tableHeader', alignment: 'right' },
    ],
    ...data.map((r) => [
      r.date ? new Date(r.date).toLocaleDateString('es-VE') : '—',
      r.supplierTaxId || '—',
      r.supplierName || '—',
      r.invoiceNumber || '—',
      r.controlNumber || '—',
      { text: fmt(Number(r.subtotal)), alignment: 'right' },
      { text: fmt(Number(r.taxAmount)), alignment: 'right' },
      { text: fmt(Number(r.totalAmount)), alignment: 'right', bold: true },
    ]),
  ];

  return { table: { headerRows: 1, widths: [50, 50, '*', 60, 55, 60, 55, 60], body }, layout: 'lightHorizontalLines' } as unknown as Content;
}

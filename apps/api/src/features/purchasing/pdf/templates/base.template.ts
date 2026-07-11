import { Content, TableCell } from 'pdfmake/interfaces';
import { PurchasingPdfConfig, PurchasingPdfItem } from '../purchasing-pdf.types';

// ── LOGO PLACEHOLDER ──
function buildLogoPlaceholder(): Content {
  return {
    canvas: [
      {
        type: 'rect',
        x: 0,
        y: 0,
        w: 80,
        h: 80,
        r: 6,
        color: '#e2e8f0',
        fillOpacity: 1,
      },
      {
        type: 'rect',
        x: 0,
        y: 0,
        w: 80,
        h: 80,
        r: 6,
        lineWidth: 1.5,
        lineColor: '#94a3b8',
      },
    ],
  };
}

// ── UTILIDADES ──
function formatDateStr(value: Date | string): string {
  const raw = value instanceof Date ? value.toISOString() : String(value);
  const [y, m, d] = raw.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

// ── HEADER: 2 COLUMNAS (izq: empresa | der: título+fecha+número) ──
// ── HEADER: Alineación corregida (Logo superior completo | 2 columnas abajo para datos y título) ──
function buildHeader(config: PurchasingPdfConfig): Content {
  const t = config.tenant;

  // Líneas con los datos fiscales de la empresa
  const companyLines: Content[] = [
    { text: t.name, bold: true, fontSize: 12, margin: [0, 0, 0, 2], color: '#1e293b' },
    { text: `RIF: ${t.rif}`, fontSize: 9, margin: [0, 0, 0, 1], color: '#475569' },
    ...(t.address ? [{ text: `Dirección: ${t.address}`, fontSize: 8, color: '#64748b' }] : []),
    ...(t.phone ? [{ text: `Teléfono: ${t.phone}`, fontSize: 8, color: '#64748b' }] : []),
    ...(t.email ? [{ text: `Correo: ${t.email}`, fontSize: 8, color: '#64748b' }] : []),
  ];

  const refDisplay = config.numericReference ?? config.reference;

  // Líneas con los datos de la Orden/Documento (ahora alineados a la derecha de forma nativa)
  const titleLines: Content[] = [
    { text: config.title.toUpperCase(), bold: true, fontSize: 12, alignment: 'right' as const, color: '#1e3a5f', margin: [0, 0, 0, 4] },
    { text: `Fecha: ${formatDateStr(config.date)}`, fontSize: 9, alignment: 'right' as const, color: '#334155', margin: [0, 0, 0, 2] },
    { text: `N° ${refDisplay}`, fontSize: 9, alignment: 'right' as const, color: '#334155', bold: true },
  ];

  return {
    margin: [0, 0, 0, 12],
    stack: [
      // 1. Colocamos el logo en su propia línea arriba para que no interfiera con las alturas
      {
        image: null, // Si usas el placeholder:
        stack: [buildLogoPlaceholder()],
        margin: [0, 0, 0, 10]
      },
      // 2. Creamos la estructura de 2 columnas justo debajo del logo
      {
        columns: [
          {
            width: '60%', // Espacio holgado para RIF, Nombre y dirección larga
            stack: companyLines,
          },
          {
            width: '40%', // Bloque del documento
            stack: titleLines,
          },
        ],
        columnGap: 10,
      }
    ]
  } as any;
}

// ── SEPARADOR ──
function buildSeparator(): Content {
  return {
    canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: '#2563eb' }],
    margin: [0, 4, 0, 4],
  };
}

// ── DATOS DEL PROVEEDOR ──
function buildSupplierSection(config: PurchasingPdfConfig): Content {
  const s = config.supplier;

  const tableBody: TableCell[][] = [
    [
      { text: 'Proveedor', bold: true, fontSize: 8, fillColor: '#f8fafc', border: [true, true, true, true] },
      { text: s.name, fontSize: 8, border: [true, true, true, true] },
      { text: 'RIF', bold: true, fontSize: 8, fillColor: '#f8fafc', border: [true, true, true, true] },
      { text: s.taxId, fontSize: 8, border: [true, true, true, true] },
    ],
    [
      { text: 'Dirección', bold: true, fontSize: 8, fillColor: '#f8fafc', border: [true, true, true, true] },
      { text: s.address || '—', fontSize: 8, border: [true, true, true, true] },
      { text: 'Teléfono', bold: true, fontSize: 8, fillColor: '#f8fafc', border: [true, true, true, true] },
      { text: s.phone || '—', fontSize: 8, border: [true, true, true, true] },
    ],
    [
      { text: 'Correo', bold: true, fontSize: 8, fillColor: '#f8fafc', border: [true, true, true, true] },
      { text: s.email || '—', fontSize: 8, colSpan: 3, border: [true, true, true, true] },
      { text: '', border: [true, true, true, true] },
      { text: '', border: [true, true, true, true] },
    ],
  ];

  return {
    table: {
      widths: ['14%', '36%', '14%', '36%'],
      body: tableBody,
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#cbd5e1',
      vLineColor: () => '#cbd5e1',
      paddingLeft: () => 5,
      paddingRight: () => 5,
      paddingTop: () => 3,
      paddingBottom: () => 3,
    },
    margin: [0, 0, 0, 12],
  } as any;
}

// ── TABLA DE ÍTEMS (sin columna código) ──
function buildItemsTable(
  items: PurchasingPdfItem[],
  currencyCode: string,
): Content {
  const sym = getCurrencySymbol(currencyCode);

  const headerRow: TableCell[] = [
    { text: '#', bold: true, style: 'tableHeader', alignment: 'center' },
    { text: 'Descripción', bold: true, style: 'tableHeader' },
    { text: 'Cant.', bold: true, style: 'tableHeader', alignment: 'center' },
    { text: 'Costo Unit.', bold: true, style: 'tableHeader', alignment: 'right' },
    { text: 'IVA %', bold: true, style: 'tableHeader', alignment: 'center' },
    { text: 'Total', bold: true, style: 'tableHeader', alignment: 'right' },
  ];

  const bodyRows: TableCell[][] = items.map((item, i) => {
    const subtotal = item.quantity * item.unitCost;
    const taxRate = item.taxPercent ?? 0;
    const tax = subtotal * (taxRate / 100);
    const total = item.totalLine ?? subtotal + tax;

    return [
      { text: (i + 1).toString(), fontSize: 8, alignment: 'center' },
      { text: item.description, fontSize: 8 },
      { text: item.quantity.toString(), fontSize: 8, alignment: 'center' },
      { text: `${sym} ${item.unitCost.toFixed(2)}`, fontSize: 8, alignment: 'right' },
      { text: `${taxRate}%`, fontSize: 8, alignment: 'center' },
      { text: `${sym} ${total.toFixed(2)}`, fontSize: 8, alignment: 'right' },
    ];
  });

  return {
    table: {
      widths: [20, '*', 40, 65, 40, 70],
      body: [headerRow, ...bodyRows],
    },
    layout: {
      fillColor: () => null,
      hLineWidth: (i: number) => (i === 0 ? 1 : 0.5),
      vLineWidth: () => 0.5,
      hLineColor: () => '#cbd5e1',
      vLineColor: () => '#e2e8f0',
      paddingLeft: () => 5,
      paddingRight: () => 5,
      paddingTop: () => 4,
      paddingBottom: () => 4,
    },
    margin: [0, 0, 0, 10],
  } as any;
}

// ── TOTALES ──
function buildTotalsSummary(
  totals: { subtotal: number; taxAmount: number; totalAmount: number },
  subtotalsExtra: { label: string; amount: number }[] | undefined,
  currencyCode: string,
  exchangeRate?: number,
  isForeignCurrency?: boolean,
): Content {
  const sym = getCurrencySymbol(currencyCode);

  const lines: TableCell[][] = [];

  lines.push([
    { text: 'Subtotal', bold: true, fontSize: 9, border: [false, false, false, false] },
    { text: `${sym} ${totals.subtotal.toFixed(2)}`, fontSize: 9, alignment: 'right', border: [false, false, false, false] },
  ]);

  lines.push([
    { text: 'IVA', bold: true, fontSize: 9, border: [false, false, false, false] },
    { text: `${sym} ${totals.taxAmount.toFixed(2)}`, fontSize: 9, alignment: 'right', border: [false, false, false, false] },
  ]);

  if (subtotalsExtra) {
    for (const extra of subtotalsExtra) {
      lines.push([
        { text: extra.label, bold: true, fontSize: 9, border: [false, false, false, false] },
        { text: `${sym} ${extra.amount.toFixed(2)}`, fontSize: 9, alignment: 'right', border: [false, false, false, false] },
      ]);
    }
  }

  lines.push([
    { text: '', border: [false, false, false, false], margin: [0, 3, 0, 0] },
    { text: '', border: [false, false, false, false] },
  ]);

  lines.push([
    { text: 'TOTAL', bold: true, fontSize: 11, border: [true, true, true, true], fillColor: '#e2e8f0' },
    { text: `${sym} ${totals.totalAmount.toFixed(2)}`, bold: true, fontSize: 11, alignment: 'right', border: [true, true, true, true], fillColor: '#e2e8f0' },
  ]);

  if (isForeignCurrency && exchangeRate && currencyCode !== 'VES') {
    const vesEquivalent = totals.totalAmount * exchangeRate;
    lines.push([
      { text: `Equivalente en VES (tasa ${exchangeRate})`, fontSize: 8, italics: true, color: '#666', border: [false, false, false, false], margin: [0, 2, 0, 0] },
      { text: `Bs. ${vesEquivalent.toFixed(2)}`, fontSize: 8, italics: true, color: '#666', alignment: 'right', border: [false, false, false, false] },
    ]);
  }

  return {
    table: {
      widths: ['*', 120],
      body: lines,
    },
    layout: 'noBorders',
    margin: [0, 10, 0, 10],
    alignment: 'right',
  } as any;
}

// ── OBSERVACIONES ──
function buildObservations(text: string): Content {
  return {
    margin: [0, 8, 0, 10],
    stack: [
      { text: 'Observaciones', bold: true, fontSize: 9, margin: [0, 0, 0, 3], color: '#334155' },
      { text: text, fontSize: 8, color: '#475569', margin: [4, 0, 4, 0] },
    ],
  } as any;
}

// ── FIRMAS ──
function buildSignatures(): Content {
  return {
    margin: [0, 30, 0, 0],
    columns: [
      {
        width: '*',
        stack: [
          { canvas: [{ type: 'line', x1: 30, y1: 0, x2: 190, y2: 0, lineWidth: 1 }] },
          { text: 'Recibido por', fontSize: 8, alignment: 'center', color: '#64748b', margin: [0, 6, 0, 0] },
        ],
      },
      {
        width: '*',
        stack: [
          { canvas: [{ type: 'line', x1: 30, y1: 0, x2: 190, y2: 0, lineWidth: 1 }] },
          { text: 'Entregado por', fontSize: 8, alignment: 'center', color: '#64748b', margin: [0, 6, 0, 0] },
        ],
      },
    ],
  } as any;
}

// ── INFO DE PAGO (para pagos) ──
function buildPaymentAppliedTable(
  applied: { reference: string; amount: number }[],
  currencyCode: string,
): Content {
  if (!applied || applied.length === 0) return { text: '' };
  const sym = getCurrencySymbol(currencyCode);

  return {
    table: {
      widths: ['*', 'auto'],
      body: [
        [
          { text: 'CxP / Referencia', bold: true, fontSize: 8, fillColor: '#f1f5f9' },
          { text: 'Monto', bold: true, fontSize: 8, fillColor: '#f1f5f9', alignment: 'right' },
        ],
        ...applied.map((a) => [
          { text: a.reference, fontSize: 8 },
          { text: `${sym} ${a.amount.toFixed(2)}`, fontSize: 8, alignment: 'right' },
        ]),
      ],
    },
    layout: 'lightHorizontalLines',
    margin: [0, 5, 0, 10],
  } as any;
}

// ── TABLA INFO GENERAL ──
function buildInfoTable(config: PurchasingPdfConfig): Content {
  const CURRENCY_MAP: Record<string, string> = { VES: 'Bolívares', USD: 'USD', EUR: 'EUR' };
  const leftRows: [string, string][] = [];
  if (config.dueDate) {
    leftRows.push(['Fecha Vencimiento', formatDateStr(config.dueDate)]);
  }
  leftRows.push(['Moneda', CURRENCY_MAP[config.currencyCode] ?? config.currencyCode]);
  if (config.exchangeRate && config.currencyCode !== 'VES') {
    leftRows.push(['Tasa de Cambio', config.exchangeRate.toFixed(4)]);
  }

  return {
    table: {
      widths: ['35%', '65%'],
      body: leftRows.map(([label, value]) => [
        { text: label, bold: true, fontSize: 8, fillColor: '#f8fafc' },
        { text: value, fontSize: 8 },
      ]),
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#cbd5e1',
      vLineColor: () => '#cbd5e1',
      paddingLeft: () => 5,
      paddingRight: () => 5,
      paddingTop: () => 3,
      paddingBottom: () => 3,
    },
    margin: [0, 0, 0, 10],
  } as any;
}

function getCurrencySymbol(code: string): string {
  switch (code) {
    case 'USD': return '$';
    case 'EUR': return '€';
    default: return 'Bs.';
  }
}

// ── EXPORTACIONES ──
export {
  buildHeader,
  buildSeparator,
  buildSupplierSection,
  buildItemsTable,
  buildTotalsSummary,
  buildObservations,
  buildSignatures,
  buildPaymentAppliedTable,
  buildInfoTable,
};

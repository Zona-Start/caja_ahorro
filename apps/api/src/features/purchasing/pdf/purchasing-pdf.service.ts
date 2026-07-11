import { Injectable } from '@nestjs/common';
import { join } from 'path';
import PdfPrinter from 'pdfmake';
import { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import { PurchasingPdfConfig } from './purchasing-pdf.types';
import {
  buildHeader,
  buildSeparator,
  buildSupplierSection,
  buildItemsTable,
  buildInfoTable,
  buildObservations,
  buildPaymentAppliedTable,
  buildSignatures,
  buildTotalsSummary,
} from './templates/base.template';

interface ReportOptions {
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'A4' | 'LETTER' | 'LEGAL';
}

@Injectable()
export class PurchasingPdfService {
  private fonts = {
    Roboto: {
      normal: join(__dirname, '..', '..', '..', 'common', 'assets', 'fonts', 'Roboto-Regular.ttf'),
      bold: join(__dirname, '..', '..', '..', 'common', 'assets', 'fonts', 'Roboto-Medium.ttf'),
      italics: join(__dirname, '..', '..', '..', 'common', 'assets', 'fonts', 'Roboto-Italic.ttf'),
    },
  };

  private printer = new PdfPrinter(this.fonts);

  generate(config: PurchasingPdfConfig, options: ReportOptions = {}): PDFKit.PDFDocument {
    const { orientation = 'portrait', pageSize = 'LETTER' } = options;

    const content: Content[] = [];

    // 1. Encabezado: empresa (derecha) + título/fecha/número (izquierda)
    content.push(buildHeader(config));
    content.push(buildSeparator());

    // 2. Datos del proveedor
    content.push(buildSupplierSection(config));

    // 3. Info adicional (solo si hay dueDate, moneda extranjera, etc.)
    if (config.dueDate || (config.exchangeRate && config.currencyCode !== 'VES')) {
      content.push(buildInfoTable(config));
    }

    // 4. Ítems
    if (config.items && config.items.length > 0) {
      content.push(buildItemsTable(config.items, config.currencyCode));
    }

    // 5. Detalles de pago (solo para pagos)
    if (config.paymentInfo) {
      content.push(buildPaymentAppliedTable(config.paymentInfo.appliedAccountsPayable, config.currencyCode));
    }

    // 6. Totales
    const isForeignCurrency = !!config.exchangeRate && config.currencyCode !== 'VES';
    content.push(buildTotalsSummary(config.totals, config.subtotals, config.currencyCode, config.exchangeRate, isForeignCurrency));

    // 7. Observaciones
    if (config.observations) {
      content.push(buildObservations(config.observations));
    }

    // 8. Firmas
    content.push(buildSignatures());

    const docDefinition: TDocumentDefinitions = {
      pageSize,
      pageOrientation: orientation,
      pageMargins: [40, 35, 40, 50],
      header: () => ({
        margin: [40, 8, 40, 0],
        columns: [
          { width: '*', text: config.tenant.name, fontSize: 7, color: '#94a3b8' },
          { width: 'auto', text: new Date().toLocaleDateString('es-VE'), fontSize: 7, color: '#94a3b8', alignment: 'right' },
        ],
      }),
      footer: (_currentPage: number, pageCount: number) => ({
        text: `Página ${_currentPage} de ${pageCount}`,
        alignment: 'center',
        fontSize: 7,
        color: '#94a3b8',
        margin: [0, 10, 0, 0],
      }),
      content,
      styles: {
        tableHeader: { bold: true, fontSize: 8, fillColor: '#f1f5f9', margin: [0, 3, 0, 3] },
      },
      defaultStyle: { font: 'Roboto', fontSize: 8 },
    };

    return this.printer.createPdfKitDocument(docDefinition);
  }
}

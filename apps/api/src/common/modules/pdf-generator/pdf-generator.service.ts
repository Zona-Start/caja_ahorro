import { Inject, Injectable } from '@nestjs/common';
import PdfPrinter from 'pdfmake';
import { TDocumentDefinitions, Content } from 'pdfmake/interfaces';
import { join } from 'path';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/database/index';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';


interface ReportOptions {
  orientation?: 'portrait' | 'landscape'
  pageSize?: 'A4' | 'LETTER' | 'LEGAL'
  title?: string;
}

@Injectable()
export class PdfGeneratorService {
   constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,

  ) {}
  // Definición de fuentes (puedes usar las de default o cargar personalizadas)
  private fonts = {
    Roboto: {
      normal: join(__dirname, '..', '..', 'assets/fonts/Roboto-Regular.ttf'),
      bold: join(__dirname, '..', '..', 'assets/fonts/Roboto-Medium.ttf'),
      italics: join(__dirname, '..', '..', 'assets/fonts/Roboto-Italic.ttf'),
    },
  };

  private printer = new PdfPrinter(this.fonts);


  async generateReport(
    title: string, 
    content: Content, 
    options: ReportOptions = {}
  ): Promise<PDFKit.PDFDocument> {

     // Valores por defecto si no se envían
  const { 
      orientation = 'portrait', 
      pageSize = 'LETTER' 
    } = options;
  const [organization] = await this.drizzle.select().from(schema.company);

  const docDefinition: TDocumentDefinitions = {
    pageSize: pageSize,
    pageOrientation: orientation,
    pageMargins: [40, 80, 40, 60],

    header: (currentPage, pageCount) => {
      return {
        margin: [40, 20, 40, 0], // Margen interno del header
        columns: [
          {
            // Columna Izquierda
            width: '*', // Toma todo el espacio disponible
            stack: [
              { text: organization.name, bold: true, fontSize: 12 },
              { text: title, bold: true, fontSize: 10, color: '#666666' },
            ],
          },
          {
            // Columna Derecha
            width: 'auto', // Solo lo necesario para el texto
            stack: [
              { text: `Página ${currentPage}`, fontSize: 9 },
              { text: `Fecha: ${new Date().toLocaleDateString()}`, fontSize: 9 },
              { text: `Hora: ${new Date().toLocaleTimeString()}`, fontSize: 9 },
            ],
            alignment: 'right',
          },
        ],
      };
    },

    footer: (currentPage, pageCount) => {
      return {
        text: `Generado por Sistema - Página ${currentPage} de ${pageCount}`,
        alignment: 'center',
        fontSize: 8,
        margin: [0, 20, 0, 0],
      };
    },

    content: [
      // Ya no necesitas el título aquí si ya lo pusiste en el header
      // Pero si lo quieres mantener, asegúrate de que el margen no sea excesivo
      content, 
    ],

    styles: {
      headerTitle: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 20],
        alignment: 'center',
        decoration: 'underline'
      },
      tableHeader: {
        bold: true,
        fontSize: 9,
        fillColor: '#f3f4f6',
        margin: [0, 5, 0, 5],
      },
    },
    defaultStyle: {
      font: 'Roboto',
      fontSize: 8,
    }
  };

  return this.printer.createPdfKitDocument(docDefinition);
}

}


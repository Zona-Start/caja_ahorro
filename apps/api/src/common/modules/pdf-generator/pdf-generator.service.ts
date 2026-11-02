import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { join } from 'path';
import PdfPrinter from 'pdfmake';
import { Content, TDocumentDefinitions } from 'pdfmake/interfaces';

interface ReportOptions {
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'A4' | 'LETTER' | 'LEGAL';
  title?: string;
  /** Texto adicional debajo del título (ej. rango de fechas del filtro). */
  subtitle?: string;
  /** Tenant que se muestra en el encabezado. */
  tenantId?: string;
  /** Estilo de encabezado: estándar o formato Sudeca. */
  headerStyle?: 'default' | 'sudeca';
  sector?: string;
  registrationNumber?: string;
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
    options: ReportOptions = {},
  ): Promise<PDFKit.PDFDocument> {
    // Valores por defecto si no se envían
    const {
      orientation = 'portrait',
      pageSize = 'LETTER',
      subtitle,
      tenantId,
      headerStyle = 'default',
      sector = 'PRIVADO',
      registrationNumber = '0',
    } = options;
    const [organization] = tenantId
      ? await this.drizzle
          .select()
          .from(schema.tenants)
          .where(eq(schema.tenants.id, tenantId))
          .limit(1)
      : await this.drizzle.select().from(schema.tenants).limit(1);

    const docDefinition: TDocumentDefinitions = {
      pageSize: pageSize,
      pageOrientation: orientation,
      pageMargins: [40, 80, 40, 60],

      header: (currentPage, pageCount) => {
        if (headerStyle === 'sudeca') {
          return {
            margin: [40, 20, 40, 0],
            stack: [
              {
                text: organization?.name ?? 'Caja de Ahorro',
                bold: true,
                fontSize: 14,
                alignment: 'center',
              },
              {
                text: `SECTOR: ${sector}     NUMERO DE REGISTRO: ${registrationNumber}`,
                fontSize: 9,
                alignment: 'center',
                margin: [0, 2, 0, 0],
              },
              {
                text: title,
                bold: true,
                fontSize: 11,
                alignment: 'center',
                margin: [0, 6, 0, 0],
              },
            ],
          };
        }

        return {
          margin: [40, 20, 40, 0], // Margen interno del header
          columns: [
            {
              // Columna Izquierda
              width: '*', // Toma todo el espacio disponible
              stack: [
                {
                  text: organization?.name ?? 'Caja de Ahorro',
                  bold: true,
                  fontSize: 12,
                },
                { text: title, bold: true, fontSize: 10, color: '#666666' },
                ...(subtitle
                  ? [
                      {
                        text: subtitle,
                        fontSize: 9,
                        color: '#444444',
                        margin: [0, 2, 0, 0] as [
                          number,
                          number,
                          number,
                          number,
                        ],
                      },
                    ]
                  : []),
              ],
            },
            {
              // Columna Derecha
              width: 'auto', // Solo lo necesario para el texto
              stack: [
                { text: `Página ${currentPage} de ${pageCount}`, fontSize: 9 },
                {
                  text: `Fecha: ${new Date().toLocaleDateString('es-VE')}`,
                  fontSize: 9,
                },
                {
                  text: `Hora: ${new Date().toLocaleTimeString('es-VE')}`,
                  fontSize: 9,
                },
              ],
              alignment: 'right',
            },
          ],
        };
      },

      ...(headerStyle !== 'sudeca'
        ? {
            footer: (currentPage: number, pageCount: number) => ({
              text: `Generado por Sistema - Página ${currentPage} de ${pageCount}`,
              alignment: 'center',
              fontSize: 8,
              margin: [0, 20, 0, 0],
            }),
          }
        : {}),

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
          decoration: 'underline',
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
      },
    };

    return this.printer.createPdfKitDocument(docDefinition);
  }
}

import { BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

export interface ParsedBalance {
  accountCode: string;
  descripcion: string;
  auxiliarSocio: string | null;
  auxiliarProveedor: string | null;
  debe: number;
  haber: number;
}
/**
 * Parsea un archivo Excel y extrae los datos de carga inicial
 * Espera las columnas: cuenta, descripcion, auxiliar_socio, auxiliar_proveedor, debe, haber
 */
export async function parseExcelFile(buffer: Buffer): Promise<ParsedBalance[]> {
  try {
    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(buffer as any);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new BadRequestException('El archivo Excel está vacío');
    }

    const balances: ParsedBalance[] = [];
    const headers: { [key: string]: number } = {};

    // Helper para extraer el valor real soportando fórmulas, richText o valores primitivos
    const getCellValue = (cellValue: any): any => {
      if (typeof cellValue === 'object' && cellValue !== null) {
        if ('result' in cellValue) return cellValue.result;
        if ('richText' in cellValue) {
          return cellValue.richText.map((t: any) => t.text).join('');
        }
      }
      return cellValue;
    };

    // Leer la primera fila para obtener los headers
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell, colNumber) => {
      const rawValue = getCellValue(cell.value);
      const headerName = String(rawValue ?? '').toLowerCase().trim();
      headers[headerName] = colNumber;
    });

    // Validar que existan las columnas requeridas: cuenta, descripcion, debe, haber
    const cuentaCol = headers['cuenta'] || headers['accountcode'] || headers['code'];
    const descripcionCol = headers['descripcion'] || headers['descripción'] || headers['description'];
    const debeCol = headers['debe'] || headers['debit'];
    const haberCol = headers['haber'] || headers['credit'];

    const missingColumns: string[] = [];
    if (!cuentaCol) missingColumns.push('cuenta');
    if (!descripcionCol) missingColumns.push('descripcion');
    if (!debeCol) missingColumns.push('debe');
    if (!haberCol) missingColumns.push('haber');

    if (missingColumns.length > 0) {
      throw new BadRequestException(
        `Faltan las siguientes columnas requeridas en el Excel: ${missingColumns.join(', ')}`,
      );
    }

    // Índices para columnas opcionales de auxiliares
    const auxiliarSocioCol =
      headers['auxiliar_socio'] || headers['auxiliar socio'] || headers['socio'];
    const auxiliarProveedorCol =
      headers['auxiliar_proveedor'] ||
      headers['auxiliar proveedor'] ||
      headers['proveedor'];

    // Leer las filas de datos (desde la fila 2)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Saltar header

      const accountCode = getCellValue(row.getCell(cuentaCol).value);
      const descripcion = getCellValue(row.getCell(descripcionCol).value);
      const rawDebe = getCellValue(row.getCell(debeCol).value);
      const rawHaber = getCellValue(row.getCell(haberCol).value);

      // Validar que la fila no esté completamente vacía
      if (!accountCode && !descripcion && rawDebe === null && rawHaber === null) {
        return;
      }

      if (!accountCode || !descripcion) {
        throw new BadRequestException(
          `La fila ${rowNumber} tiene campos obligatorios incompletos (cuenta o descripción).`,
        );
      }

      const accountCodeStr = String(accountCode).trim();
      const descripcionStr = String(descripcion).trim();

      const debeNum = rawDebe !== null && rawDebe !== undefined && rawDebe !== '' ? Number(rawDebe) : 0;
      const haberNum = rawHaber !== null && rawHaber !== undefined && rawHaber !== '' ? Number(rawHaber) : 0;

      if (isNaN(debeNum)) {
        throw new BadRequestException(
          `El valor del DEBE en la fila ${rowNumber} no es un número válido: ${rawDebe}`,
        );
      }

      if (isNaN(haberNum)) {
        throw new BadRequestException(
          `El valor del HABER en la fila ${rowNumber} no es un número válido: ${rawHaber}`,
        );
      }

      const auxiliarSocio = auxiliarSocioCol
        ? String(getCellValue(row.getCell(auxiliarSocioCol).value) ?? '').trim()
        : null;
      const auxiliarProveedor = auxiliarProveedorCol
        ? String(getCellValue(row.getCell(auxiliarProveedorCol).value) ?? '').trim()
        : null;

      // Preservar el valor numérico con su signo original sin aplicar Math.abs()
      balances.push({
        accountCode: accountCodeStr,
        descripcion: descripcionStr,
        auxiliarSocio: auxiliarSocio || null,
        auxiliarProveedor: auxiliarProveedor || null,
        debe: debeNum,
        haber: haberNum,
      });
    });

    if (balances.length === 0) {
      throw new BadRequestException(
        'No se encontraron datos válidos en el archivo Excel',
      );
    }

    return balances;
  } catch (error) {
    if (error instanceof BadRequestException) {
      throw error;
    }
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    throw new BadRequestException(
      `Error al procesar el archivo Excel: ${errorMessage}`,
    );
  }
}
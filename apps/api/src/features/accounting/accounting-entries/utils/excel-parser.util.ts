import { BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

export interface ParsedAccountingEntryRow {
  accountCode: string;
  auxiliarSocio: string | null;
  descripcion: string | null;
  debit: number;
  credit: number;
}

export interface ParsedAccountingEntry {
  description: string;
  entryDate: string;
  rows: ParsedAccountingEntryRow[];
}

/**
 * Convierte un valor de fecha de Excel (Date, número serial o string) a YYYY-MM-DD.
 */
function parseDate(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';

  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }

  if (typeof value === 'number') {
    // Serial de fecha de Excel
    const ms = Math.round((value - 25569) * 86400 * 1000);
    return new Date(ms).toISOString().split('T')[0];
  }

  const str = String(value).trim();
  // Acepta formatos con guiones o barras
  const normalized = str.replace(/\//g, '-');
  const d = new Date(normalized);
  if (isNaN(d.getTime())) {
    throw new BadRequestException(`Fecha inválida en la plantilla: ${str}`);
  }
  return d.toISOString().split('T')[0];
}

/**
 * Parsea el Excel de asientos contables.
 * Línea 1: Descripción y Fecha (etiquetas "Descripción" y "Fecha" seguidas de su valor).
 * Línea 2: encabezados de columnas (cuenta, auxiliar_socio, debitos, creditos).
 * Líneas 3+: detalle de cada línea del asiento.
 */
export async function parseAccountingEntriesExcel(
  buffer: Buffer,
): Promise<ParsedAccountingEntry> {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new BadRequestException('El archivo Excel está vacío');
    }

    // ---- Línea 1: Descripción y Fecha ----
    const headerRow = worksheet.getRow(1);
    let description = '';
    let entryDate = '';

    headerRow.eachCell((cell, colNumber) => {
      const label = String(cell.value ?? '').trim().toLowerCase();
      if (label === 'descripción' || label === 'descripcion') {
        description = String(headerRow.getCell(colNumber + 1).value ?? '')
          .trim();
      } else if (label === 'fecha') {
        entryDate = parseDate(headerRow.getCell(colNumber + 1).value);
      }
    });

    // ---- Línea 2: encabezados de columnas ----
    const columnsRow = worksheet.getRow(2);
    const headers: { [key: string]: number } = {};
    columnsRow.eachCell((cell, colNumber) => {
      const headerName = String(cell.value ?? '').toLowerCase().trim();
      headers[headerName] = colNumber;
    });

    const cuentaCol = headers['cuenta'];
    const auxiliarSocioCol =
      headers['auxiliar_socio'] || headers['auxiliar socio'] || headers['socio'];
    const descripcionCol = headers['descripcion'];
    const debitCol = headers['debitos'] || headers['debito'] || headers['debe'];
    const creditCol =
      headers['creditos'] || headers['credito'] || headers['haber'];

    if (!cuentaCol || !debitCol || !creditCol || !descripcionCol) {
      throw new BadRequestException(
        'Faltan columnas requeridas en la plantilla: cuenta, debitos, creditos y descripcion',
      );
    }

    // ---- Líneas 3+: detalle ----
    const rows: ParsedAccountingEntryRow[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return; // Saltar línea de datos generales y encabezados

      const accountCode = String(row.getCell(cuentaCol).value ?? '').trim();
      if (!accountCode) return; // fila vacía

      const auxiliarSocio = auxiliarSocioCol
        ? String(row.getCell(auxiliarSocioCol).value ?? '').trim()
        : '';
      const debit = Number(row.getCell(debitCol).value ?? 0) || 0;
      const credit = Number(row.getCell(creditCol).value ?? 0) || 0;
      const descripcion = String(row.getCell(descripcionCol).value ?? '').trim();

      rows.push({
        accountCode,
        auxiliarSocio: auxiliarSocio || null,
        debit,
        credit,
        descripcion,
      });
    });

    return { description, entryDate, rows };
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

/**
 * Genera el buffer del archivo de plantilla para la carga de asientos.
 */
export async function generateAccountingEntriesTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Asiento Contable');

  worksheet.columns = [
    { header: '', key: 'a', width: 18 },
    { header: '', key: 'b', width: 40 },
    { header: '', key: 'c', width: 18 },
    { header: '', key: 'd', width: 18 },
  ];

  // Línea 1: Descripción y Fecha
  worksheet.getCell('A1').value = 'Descripción';
  worksheet.getCell('B1').value = 'Asiento de ejemplo';
  worksheet.getCell('C1').value = 'Fecha';
  worksheet.getCell('D1').value = '2026-01-15';

  // Línea 2: encabezados
  worksheet.getCell('A2').value = 'cuenta';
  worksheet.getCell('B2').value = 'auxiliar_socio';
  worksheet.getCell('C2').value = 'descripcion';
  worksheet.getCell('D2').value = 'debitos';
  worksheet.getCell('E2').value = 'creditos';

  // Líneas de ejemplo (partida doble equilibrada)
  worksheet.getCell('A3').value = '112.01.01.01.001';
  worksheet.getCell('B3').value = '';
  worksheet.getCell('C3').value = 'APORTE DE SOCIO';
  worksheet.getCell('D3').value = 1000.0;
  worksheet.getCell('E3').value = 0;

  worksheet.getCell('A4').value = '311.01.01.00.001';
  worksheet.getCell('B4').value = 'V-12345678';
  worksheet.getCell('C4').value = 'APORTE DE SOCIO';
  worksheet.getCell('D4').value = 1000.0;
  worksheet.getCell('E4').value = 0;

  // Estilos básicos para encabezados
  const headerRow1 = worksheet.getRow(1);
  headerRow1.getCell(1).font = { bold: true };
  headerRow1.getCell(3).font = { bold: true };

  const headerRow2 = worksheet.getRow(2);
  headerRow2.font = { bold: true };
  headerRow2.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF3F4F6' },
    };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

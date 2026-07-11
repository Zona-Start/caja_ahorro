import { BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

export interface ParsedBalance {
  accountCode: string;
  descripcion: string;
  balance: number;
}

/**
 * Parsea un archivo Excel y extrae los datos de carga inicial
 * Espera las columnas: cuenta, descripcion, saldo
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

    // Leer la primera fila para obtener los headers
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell, colNumber) => {
      const headerName = String(cell.value).toLowerCase().trim();
      headers[headerName] = colNumber;
    });

    // Validar que existan las columnas requeridas
    const requiredColumns = ['cuenta', 'descripcion', 'saldo'];
    const missingColumns = requiredColumns.filter(
      (col) => !headers[col] && !headers[col.replace('ó', 'o')],
    );

    if (missingColumns.length > 0) {
      throw new BadRequestException(
        `Faltan las siguientes columnas en el Excel: ${missingColumns.join(', ')}`,
      );
    }

    // Determinar los índices de las columnas (con o sin tilde)
    const cuentaCol = headers['cuenta'];
    const descripcionCol = headers['descripcion'] || headers['descripción'];
    const saldoCol = headers['saldo'];

    // Leer las filas de datos (desde la fila 2)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Saltar header

      const accountCode = row.getCell(cuentaCol).value;
      const descripcion = row.getCell(descripcionCol).value;
      const balance = row.getCell(saldoCol).value;

      // Validar que la fila tenga datos
      if (
        !accountCode ||
        !descripcion ||
        balance === null ||
        balance === undefined
      ) {
        // Fila vacía o incompleta, la saltamos
        return;
      }

      // Convertir y validar los datos
      const accountCodeStr = String(accountCode).trim();
      const descripcionStr = String(descripcion).trim();
      const balanceNum = Number(balance);

      if (isNaN(balanceNum)) {
        throw new BadRequestException(
          `El saldo en la fila ${rowNumber} no es un número válido: ${balance}`,
        );
      }

      balances.push({
        accountCode: accountCodeStr,
        descripcion: descripcionStr,
        balance: balanceNum,
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

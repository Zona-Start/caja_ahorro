import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

@Injectable()
export class SpecialOperationsTemplateService {
  async generateTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Zona Start';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('operacion-especial');

    sheet.columns = [
      { header: 'cedula', key: 'cedula', width: 24 },
      { header: 'fecha', key: 'fecha', width: 18 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F497D' },
    };

    sheet.addRow({ cedula: 'V-12345678', fecha: '2026-01-28' });
    sheet.addRow({ cedula: 'V-87654321', fecha: '2026-01-28' });

    // Forzar texto en la cédula para no perder ceros a la izquierda.
    sheet.getColumn('cedula').numFmt = '@';
    sheet.getColumn('fecha').numFmt = 'yyyy-mm-dd';

    const instructions = workbook.addWorksheet('instrucciones');
    instructions.columns = [{ width: 110 }];
    instructions.addRow([
      'Plantilla de Operaciones Especiales - Caja de Ahorro',
    ]).font = { bold: true, size: 14 };
    instructions.addRow(['']);
    instructions.addRow([
      '1. No modifique los nombres de las columnas: cedula y fecha.',
    ]);
    instructions.addRow([
      '2. Cada fila representa un asociado que será procesado en la operación.',
    ]);
    instructions.addRow([
      '3. La cédula debe existir en la caja de ahorro y corresponder al tenant actual.',
    ]);
    instructions.addRow([
      '4. La fecha es opcional; si se deja vacía se usará la fecha de la operación.',
    ]);
    instructions.addRow([
      '5. No se permiten cédulas duplicadas dentro del mismo archivo.',
    ]);
    instructions.addRow([
      '6. Guarde el archivo en formato .xlsx antes de cargarlo.',
    ]);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer as ArrayBuffer);
  }
}

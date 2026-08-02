import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

@Injectable()
export class PurchasingXlsxService {
  generateReport(columns: string[], rows: any[][], sheetName = 'Reporte'): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(sheetName);

    sheet.columns = columns.map((title, i) => ({
      header: title,
      key: `col${i}`,
      width: Math.max(title.length + 4, 15),
    }));

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F497D' } };
    headerRow.alignment = { horizontal: 'center' };

    for (const row of rows) {
      const dataRow: Record<string, any> = {};
      row.forEach((val, i) => { dataRow[`col${i}`] = val; });
      sheet.addRow(dataRow);
    }

    return workbook.xlsx.writeBuffer() as Promise<Buffer>;
  }
}

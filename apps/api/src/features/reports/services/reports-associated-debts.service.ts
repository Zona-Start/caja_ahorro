import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/index';
import { Inject, Injectable, StreamableFile } from '@nestjs/common';
import { format } from 'date-fns';
import { and, eq, gte, inArray, lte, or } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as Excel from 'exceljs';
import { PassThrough } from 'stream';
import { GetAssociatedDebtsDto } from '../dto/get-associated-debts.dto';

type RawRow = any; // devuelto por drizzle
export interface ClassifiedRow extends RawRow {
  debtAmount: number;
  installmentAmount: number;
  inclusionExclusion: 'INCLUSION' | 'EXCLUSION' | 'FUERA_DE_RANGO';
}

@Injectable()
export class ReportsAssociatedDebtsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
  ) {}

  /* ---------- privates ---------- */
  private async fetchLoans(start: Date, end: Date) {
    return await this.db
      .select({
        cedula: schema.associates.cedula,
        fullname: schema.associates.fullname,
        employeeType: schema.categoryType.description,
        debtAmount: schema.loans.requestedAmount,
        installments: schema.loans.termUnits,
        installmentAmount: schema.loans.installmentAmount,
        payrollCode: schema.typePayrolls.code,
        status: schema.loans.status,
        updatedAt: schema.loans.updatedAt,
      })
      .from(schema.loans)
     .innerJoin( 
        schema.associates,
        eq(schema.loans.associateId, schema.associates.id),
      )
      .leftJoin(
        schema.categoryType,
        eq(schema.associates.associatedTypeId, schema.categoryType.id),
      )
      .leftJoin(
        schema.loanTypes,
        eq(schema.loans.loanTypeId, schema.loanTypes.id),
      )
      .leftJoin(
        schema.typePayrolls,
        eq(schema.loanTypes.payrollTypeId, schema.typePayrolls.id),
      )
       .where(
        or(
          // Caso 1: Deuda viva (Desembolsado o En Pago) -> INCLUSION
          inArray(schema.loans.status, ['DISBURSED', 'IN_PAYMENT']),
          // Caso 2: Deuda recién pagada en este rango -> EXCLUSION
          and(
            eq(schema.loans.status, 'PAID'),
            gte(schema.loans.updatedAt, start),
            lte(schema.loans.updatedAt, end),
          ),
        ),
      );
  }

  private async fetchCredits(start: Date, end: Date) {
    return await this.db
      .select({
        cedula: schema.associates.cedula,
        fullname: schema.associates.fullname,
        employeeType: schema.categoryType.description,
        debtAmount: schema.credits.requestedAmount,
        installments: schema.creditsTypes.termUnits,
        installmentAmount: schema.credits.installmentAmount,
        payrollCode: schema.typePayrolls.code,
        status: schema.credits.status,
        updatedAt: schema.credits.updatedAt,
      })
      .from(schema.credits)
      .innerJoin(
        schema.associates,
        eq(schema.credits.associateId, schema.associates.id),
      )
      .leftJoin(
        schema.categoryType,
        eq(schema.associates.associatedTypeId, schema.categoryType.id),
      )
      .leftJoin(
        schema.creditsTypes,
        eq(schema.credits.creditTypeId, schema.creditsTypes.id),
      )
      .leftJoin(
        schema.typePayrolls,
        eq(schema.creditsTypes.payrollTypeId, schema.typePayrolls.id),
      )
      .where(
        or(
          inArray(schema.credits.status, ['APPROVED', 'IN_PAYMENT']),
          and(
            eq(schema.credits.status, 'PAID'),
            gte(schema.credits.updatedAt, start),
            lte(schema.credits.updatedAt, end),
          ),
        ),
      );
  }

  private classifyRow(row: any, startDate: Date, endDate: Date): ClassifiedRow {
    const status = row.status;
    // Aseguramos que la fecha sea un objeto Date válido para comparación
    const updatedAt = row.updatedAt ? new Date(row.updatedAt) : null; 

    // Si está PAGADO y la fecha de pago está en el rango solicitado -> EXCLUSIÓN
    if (status === 'PAID' && updatedAt && updatedAt >= startDate && updatedAt <= endDate) {
      return { 
        ...row, 
        debtAmount: Number(row.debtAmount ?? 0),
        installmentAmount: Number(row.installmentAmount ?? 0),
        inclusionExclusion: 'EXCLUSION' 
      };
    }

    // Si está DESEMBOLSADO o EN PAGO -> INCLUSIÓN (debe descontarse)
    if (status === 'DISBURSED' || status === 'IN_PAYMENT') {
      return { 
        ...row, 
        debtAmount: Number(row.debtAmount ?? 0),
        installmentAmount: Number(row.installmentAmount ?? 0),
        inclusionExclusion: 'INCLUSION' 
      };
    }

    // Otros estados (APROBADO, RECHAZADO, PAID antiguo) no se incluyen en el reporte de nómina
    return { 
      ...row, 
      debtAmount: Number(row.debtAmount ?? 0),
      installmentAmount: Number(row.installmentAmount ?? 0),
      inclusionExclusion: 'FUERA_DE_RANGO' 
    };
  }

  private buildExcelStream(rows: ClassifiedRow[], outputStream: PassThrough) {
    const workbook = new Excel.stream.xlsx.WorkbookWriter({
      stream: outputStream, // PassThrough
      useStyles: true,
      useSharedStrings: true,
    });
    const worksheet = workbook.addWorksheet('Hoja1');

    // Fila 1: Título principal
    worksheet.addRow(['CAPREBICENTENARIO']);

    // Fila 2: Subtítulo
    worksheet.addRow(['CUOTAS POR COBRAR PRESTAMOS A SOCIO']);

    // Fila 3: Encabezados de columna
    worksheet.addRow([
      'CEDULA',
      'NOMBRE Y APELLIDO',
      'TIPO PERSONA',
      'TIPO PTMO',
      'MONTO PRESTAMO',
      'CANT. CUOTAS',
      'MONTO CUOTA',
      '', // Este es para la columna de inclusión
    ]);

    // Fila 4 en adelante: Datos
    rows.forEach((r) => {
      // Aquí es donde se define la correspondencia entre los datos y las columnas
      const rowData = [
        r.cedula,
        r.fullname,
        r.employeeType.toUpperCase(),
        r.payrollCode,
        Number(r.debtAmount).toFixed(2),
        r.installments,
        Number(r.installmentAmount).toFixed(2),
        r.inclusionExclusion,
      ];
      worksheet.addRow(rowData).commit();
    });

    // si deseo borde descomento esto
    // rows.forEach((r) => {
    //   const work = worksheet.addRow(r);

    //   work.eachCell((cell) => {
    //     cell.border = {
    //       top: { style: 'thin' },
    //       left: { style: 'thin' },
    //       bottom: { style: 'thin' },
    //       right: { style: 'thin' },
    //     };
    //   });
    // });

    worksheet.commit(); // <-- 2. cierra hoja
    workbook.commit(); // <-- 3. cierra libro y finaliza el stream
  }

  async getAssociatedDebtsStream(
    dto: GetAssociatedDebtsDto,
  ): Promise<StreamableFile> {
    const { startDate, endDate } = dto;

    // 1. Obtener datos
    const [loansData, creditsData] = await Promise.all([
      this.fetchLoans(startDate, endDate),
      this.fetchCredits(startDate, endDate),
    ]);

    // 2. Clasificar
    const classified = [...loansData, ...creditsData]
      .map((row) => this.classifyRow(row, startDate, endDate))
      .filter((r) => r.inclusionExclusion !== 'FUERA_DE_RANGO');

    // 3. Ordenar: Mostrar primero las exclusiones para que el analista las procese primero.
    classified.sort((a, b) => a.inclusionExclusion.localeCompare(b.inclusionExclusion));

    // 3. Crear stream de Excel
    const stream = new PassThrough();
    this.buildExcelStream(classified, stream);

    const filename = `deudas-${format(startDate, 'yyyyMMdd')}-${format(endDate, 'yyyyMMdd')}.xlsx`;

    return new StreamableFile(stream, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: `attachment; filename="${filename}"`,
    });
  }
}

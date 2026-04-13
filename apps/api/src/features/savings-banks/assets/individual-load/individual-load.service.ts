import { AccountingEntriesService } from '@/features/accounting/accounting-entries/accounting-entries.service';
import { AuditLogEvent } from '@/features/audit/events/audit-log.event';
import { BankMovementsService } from '@/features/bankings/bank-movements/bank-movements.service';
import {
  AssociateMovementTypeEnum,
  BankTransactionCategory,
  CurrencyCodeEnum,
  movementStatusEnum,
  paymentMethodEnum,
} from '@/types/enum';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as ExcelJS from 'exceljs';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { AssociateAccountsMovementsService } from '../../associate-accounts-movements/associate-accounts-movements.service';
import {
  BulkIndividualLoadDto,
  IndividualLoadDto,
} from './dto/create-individual-load.dto';

@Injectable()
export class IndividualLoadService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly associateMovementsService: AssociateAccountsMovementsService,
    private readonly bankMovementsService: BankMovementsService,
    private readonly accountingEntriesService: AccountingEntriesService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: IndividualLoadDto, userId: number) {
    return this.drizzle.transaction(async (tx) => {
      // 1. Obtener datos del asociado y la cuenta para obtener companyId
      const [account] = await tx
        .select()
        .from(schema.associateAccounts)
        .where(eq(schema.associateAccounts.id, dto.associateAccountId))
        .leftJoin(
          schema.associates,
          eq(schema.associateAccounts.associateId, schema.associates.id),
        );

      if (!account || !account.associates?.id) {
        throw new NotFoundException('Cuenta de asociado no encontrada');
      }

      const companyId = account.associates.companyId;
      const isEmployerContribution =
        dto.movementType === 'EMPLOYER_CONTRIBUTION';
      const results: any[] = [];

      let referenceValue: string | undefined = undefined;

      // 2. Crear movimiento(s) del asociado
      if (isEmployerContribution) {
        // Aporte Patronal: Se crean dos movimientos
        const patronalPayload = {
          associateAccountId: dto.associateAccountId,
          movementType: 'EMPLOYER_CONTRIBUTION' as AssociateMovementTypeEnum,
          amount: dto.employerAmount ?? 0,
          currencyCode: 'VES' as CurrencyCodeEnum,
          transactionDate: dto.transactionDate,
          description: dto.description || 'Aporte Patronal',
          status: 'COMPLETED' as movementStatusEnum,
        };

        const associatePayload = {
          associateAccountId: dto.associateAccountId,
          movementType: 'SAVING_CONTRIBUTION' as AssociateMovementTypeEnum,
          amount: dto.associateAmount ?? 0,
          currencyCode: 'VES' as CurrencyCodeEnum,
          transactionDate: dto.transactionDate,
          description: dto.description || 'Aporte Asociado (Vía Patronal)',
          status: 'COMPLETED' as movementStatusEnum,
        };

        const resultPatronal = await this.associateMovementsService.create(
          userId,
          patronalPayload,
          tx,
        );
        const resultAsociado = await this.associateMovementsService.create(
          userId,
          associatePayload,
          tx,
        );
        results.push(resultPatronal.data, resultAsociado.data);

        referenceValue = 'Aporte Empleados';
      } else {
        // Aporte Voluntario: Un solo movimiento
        const payload = {
          associateAccountId: dto.associateAccountId,
          movementType: dto.movementType,
          amount: dto.amount ?? 0,
          currencyCode: 'VES' as CurrencyCodeEnum,
          transactionDate: dto.transactionDate,
          description: dto.description || 'Aporte Voluntario',
          status: 'COMPLETED' as movementStatusEnum,
        };

        const result = await this.associateMovementsService.create(
          userId,
          payload,
          tx,
        );
        results.push(result.data);
        referenceValue = 'Aporte Voluntario';
      }

      const totalAmount = isEmployerContribution
        ? (dto.employerAmount ?? 0) + (dto.associateAmount ?? 0)
        : (dto.amount ?? 0);

      const mainMovementId = results[0].referenceNumber;

      // 3. Validar datos bancarios obligatorios
      if (!dto.bankAccountId || !dto.paymentMethod || !dto.referenceNumber) {
        throw new BadRequestException(
          'Los datos bancarios (cuenta, método y referencia) son obligatorios para procesar la carga individual',
        );
      }

      // 4. Crear movimiento bancario vinculado (SIEMPRE se crea pues es obligatorio)
      const dataBank = {
        movement: {
          bankAccountId: dto.bankAccountId,
          transactionDate: dto.transactionDate ?? new Date(),
          paymentMethod: dto.paymentMethod as paymentMethodEnum,
          description:
            dto.description ??
            `Abono a cuenta: ${account.associate_accounts.accountNumber}`,
          bankReference: dto.referenceNumber,
          category: 'MEMBER_CONTRIBUTION' as BankTransactionCategory,
          creditAmount: totalAmount,
          debitAmount: 0,
          createdById: userId,
        },
        links: results.map((m) => ({
          internalRecordType: 'MEMBER_CONTRIBUTION' as const,
          internalRecordId: m.id,
        })),
      };

      const bankResult = await this.bankMovementsService.createAndReconcile(
        dataBank,
        userId,
        tx,
      );

      // 5. Actualizar los movimientos del asociado con el ID del banco
      for (const m of results) {
        await tx
          .update(schema.associateAccountMovements)
          .set({
            referenceId: bankResult.movement.id.toString(),
            referenceType: 'BANK_TRANSACTION',
          })
          .where(eq(schema.associateAccountMovements.id, m.id));
      }

      // 6. Crear Asiento Contable Automático
      try {
        await this.accountingEntriesService.createAutomaticEntry(
          userId,
          {
            companyId: Number(companyId),
            category: 'SAVINGS_BANK',
            operationType: isEmployerContribution
              ? 'PAYROLL_CONCEPT'
              : 'SAVINGS_UPLOAD', // Regla general de carga de haberes
            description:
              dto.description ||
              `${isEmployerContribution ? 'Carga Aportes Patronales' : 'Carga de haberes Voluntarios'} - ${account.associates.fullname}`,
            entryDate: dto.transactionDate ?? new Date(),
            referenceValue,
            currencyCode: 'VES' as CurrencyCodeEnum,
            originReferenceId: mainMovementId.toString(),
            originType: 'SAVINGS_LOAD',
            roleAliases: isEmployerContribution
              ? {
                  SAVINGS_RECEIVABLE: 'ASSOCIATED_SAVINGS',
                  EMPLOYER_RECEIVABLE: 'EMPLOYER_CONTRIBUTION',
                }
              : {
                  BANK_ACCOUNT: 'VOLUNTARY_SAVINGS',
                },
            items: [
              {
                associateId: account.associates.id,
                amounts: isEmployerContribution
                  ? {
                      ASSOCIATED_SAVINGS: dto.associateAmount ?? 0,
                      EMPLOYER_CONTRIBUTION: dto.employerAmount ?? 0,
                    }
                  : {
                      VOLUNTARY_SAVINGS: dto.amount ?? 0,
                    },
                descriptions: isEmployerContribution
                  ? {
                      ASSOCIATED_SAVINGS: `AHORRO DEL ${(dto.transactionDate ?? new Date()).toISOString().split('T')[0]}`,
                      EMPLOYER_CONTRIBUTION: `APORTE DEL ${(dto.transactionDate ?? new Date()).toISOString().split('T')[0]}`,
                    }
                  : {
                      VOLUNTARY_SAVINGS: `AHORRO VOLUNTARIO DEL ${(dto.transactionDate ?? new Date()).toISOString().split('T')[0]}`,
                    },
              },
            ],
            globalDescriptions: isEmployerContribution
              ? {
                  ASSOCIATED_SAVINGS: `APORTES SOCIO DEL ${(dto.transactionDate ?? new Date()).toISOString().split('T')[0]}`,
                  EMPLOYER_CONTRIBUTION: `APORTE DEL PATRONO DEL ${(dto.transactionDate ?? new Date()).toISOString().split('T')[0]}`,
                }
              : {
                  VOLUNTARY_SAVINGS: `APORTES VOLUNTARIOS DEL ${(dto.transactionDate ?? new Date()).toISOString().split('T')[0]}`,
                },
          },
          tx,
        );
      } catch (error) {
        // Si el error es BadRequestException (regla no encontrada)
        if (
          error instanceof BadRequestException &&
          error.message.includes('No existe una regla contable')
        ) {
          throw new BadRequestException(
            `El sistema está configurado para asientos automáticos, pero no existe una regla contable creada para procesar estos asientos. Por favor, contacte al administrador.`,
          );
        }
        // Otros errores se lanzan normalmente
        throw error;
      }

      // 7. Registro de Auditoría
      this.eventEmitter.emit(
        'audit.log',
        new AuditLogEvent({
          tableName: 'associate_account_movements',
          recordId: mainMovementId.toString(),
          action: 'INSERT',
          userId,
          area: 'savings_banks',
          description: `Carga de haberes por ${totalAmount} Bs para asociado ${account.associates.fullname} (Cédula Asociado: ${account.associates.cedula})`,
          newData: {
            associateId: account.associates.id,
            amount: totalAmount,
            type: dto.movementType,
          },
        }),
      );

      return {
        message:
          'Carga individual procesada exitosamente con su registro contable.',
        movementId: mainMovementId,
      };
    });
  }
  /**
   * Generar plantilla de excel para carga masiva
   */
  async generateTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Carga Masiva');

    // Fila 1: tipo | 5501
    sheet.getCell('A1').value = 'tipo';
    sheet.getCell('B1').value = 'APORTE EMPLEADOS';
    sheet.getCell('A1').font = { bold: true };
    sheet.getCell('B1').font = { bold: true, color: { argb: 'FFFF0000' } };
    sheet.getCell('C1').value = 'fecha';
    sheet.getCell('D1').value = '1989-01-01';
    sheet.getCell('D1').font = { bold: true };

    // Fila 2: encabezados de tabla
    sheet.getCell('A2').value = 'cedula';
    sheet.getCell('B2').value = 'monto';
    sheet.getRow(2).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F497D' },
    };

    // Ajustar columnas
    sheet.getColumn('A').width = 20;
    sheet.getColumn('B').width = 20;

    // Fila 3: Ejemplo de datos
    sheet.getCell('A3').value = '12345678';
    sheet.getCell('B3').value = 5000;

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer as ArrayBuffer);
  }

  /**
   * Carga masiva de haberes (Lote)
   */
  async createBulk(
    fileBuffer: Buffer,
    dto: BulkIndividualLoadDto,
    userId: number,
  ) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer as any);
    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
      throw new BadRequestException(
        'El archivo Excel está vacío o es inválido',
      );
    }

    const typeCell = String(worksheet.getCell('B1').value || '').trim();
    if (typeCell !== 'APORTE EMPLEADOS' && typeCell !== 'DESCUENTOS CAJA') {
      throw new BadRequestException(
        'El tipo de carga en la celda B1 debe ser APORTE EMPLEADOS o DESCUENTOS CAJA',
      );
    }

    const rawDateCell = worksheet.getCell('D1').value;
    let validDate: Date;

    if (rawDateCell instanceof Date) {
      validDate = rawDateCell;
    } else {
      validDate = new Date(String(rawDateCell || ''));
    }

    if (isNaN(validDate.getTime()) || validDate.getFullYear() < 2000) {
      throw new BadRequestException(
        'La fecha en la celda D1 es inválida o muy antigua (debe ser posterior al año 2000)',
      );
    }

    const day = String(validDate.getDate()).padStart(2, '0');
    const month = String(validDate.getMonth() + 1).padStart(2, '0');
    const year = validDate.getFullYear();
    const dateCell = `${day}-${month}-${year}`;

    const rows: { cedula: string; monto: number }[] = [];
    worksheet.eachRow((row, rowNumber) => {
      // Saltar Fila 1 (tipo) y Fila 2 (encabezados)
      if (rowNumber <= 2) return;

      const cedula = String(row.getCell(1).value || '').trim();
      const monto = parseFloat(String(row.getCell(2).value || '0'));

      if (cedula && monto > 0) {
        rows.push({ cedula, monto });
      }
    });

    if (rows.length === 0) {
      throw new BadRequestException(
        'No se encontraron registros válidos en el archivo',
      );
    }

    return this.drizzle.transaction(async (tx) => {
      let processedCount = 0;
      let totalAmountProcessed = 0;
      const resultsAssociateMovements: any[] = [];
      const accountingItems: Array<{
        associateId: number;
        amounts: { ASSOCIATED_SAVINGS: number; EMPLOYER_CONTRIBUTION?: number };
        descriptions?: Record<string, string>;
      }> = [];

      let companyId: number | null = null;
      let referenceValueLookup: string | undefined = undefined;

      // 1. Determinar el concepto de referencia según el tipo de carga
      referenceValueLookup =
        typeCell === 'APORTE EMPLEADOS'
          ? 'Aporte Empleados'
          : 'Descuentos Caja';

      for (const row of rows) {
        // Buscar asociado
        const [associate] = await tx
          .select({
            id: schema.associates.id,
            companyId: schema.associates.companyId,
            fullname: schema.associates.fullname,
            associateAccountId: schema.associateAccounts.id,
          })
          .from(schema.associates)
          .where(eq(schema.associates.cedula, row.cedula))
          .leftJoin(
            schema.associateAccounts,
            eq(schema.associateAccounts.associateId, schema.associates.id),
          );

        if (!associate || !associate.associateAccountId) {
          continue; // Saltar si no existe o no tiene cuenta
        }

        if (!companyId) companyId = associate.companyId;

        // Crear movimientos según el tipo
        if (typeCell === 'APORTE EMPLEADOS') {
          // Aporte empleado
          const resEmp = await this.associateMovementsService.create(
            userId,
            {
              associateAccountId: associate.associateAccountId,
              movementType: 'SAVING_CONTRIBUTION' as AssociateMovementTypeEnum,
              amount: row.monto,
              currencyCode: 'VES' as CurrencyCodeEnum,
              transactionDate: dto.transactionDate ?? new Date(),
              description: 'Aporte Patronales',
              status: 'COMPLETED' as movementStatusEnum,
            },
            tx,
          );
          resultsAssociateMovements.push(resEmp.data);
          // Aporte patronal
          const resPat = await this.associateMovementsService.create(
            userId,
            {
              associateAccountId: associate.associateAccountId,
              movementType:
                'EMPLOYER_CONTRIBUTION' as AssociateMovementTypeEnum,
              amount: row.monto,
              currencyCode: 'VES' as CurrencyCodeEnum,
              transactionDate: dto.transactionDate ?? new Date(),
              description: 'Aporte Patronales',
              status: 'COMPLETED' as movementStatusEnum,
            },
            tx,
          );
          resultsAssociateMovements.push(resPat.data);
          totalAmountProcessed += row.monto * 2; // Ambos aportes

          accountingItems.push({
            associateId: associate.id,
            amounts: {
              ASSOCIATED_SAVINGS: row.monto,
              EMPLOYER_CONTRIBUTION: row.monto,
            },
            descriptions: {
              ASSOCIATED_SAVINGS: `AHORRO DEL ${dateCell}`,
              EMPLOYER_CONTRIBUTION: `APORTE DEL ${dateCell}`,
            },
          });
        } else if (typeCell === 'DESCUENTOS CAJA') {
          // Un solo movimiento
          const resDes = await this.associateMovementsService.create(
            userId,
            {
              associateAccountId: associate.associateAccountId,
              movementType: 'SAVING_CONTRIBUTION' as AssociateMovementTypeEnum,
              amount: row.monto,
              currencyCode: 'VES' as CurrencyCodeEnum,
              transactionDate: dto.transactionDate ?? new Date(),
              description: 'Aportes Patronales - Diferencia Ahorro',
              status: 'COMPLETED' as movementStatusEnum,
            },
            tx,
          );
          resultsAssociateMovements.push(resDes.data);
          totalAmountProcessed += row.monto;

          // Aporte patronal
          // await this.associateMovementsService.create(
          //   userId,
          //   {
          //     associateAccountId: associate.associateAccountId,
          //     movementType:
          //       'EMPLOYER_CONTRIBUTION' as AssociateMovementTypeEnum,
          //     amount: row.monto,
          //     currencyCode: 'VES' as CurrencyCodeEnum,
          //     transactionDate: new Date(),
          //     description: 'Carga Masiva - Aportes Patronales - Descuento Caja',
          //     status: 'COMPLETED' as movementStatusEnum,
          //   },
          //   tx,
          // );

          accountingItems.push({
            associateId: associate.id,
            amounts: {
              ASSOCIATED_SAVINGS: row.monto,
              //EMPLOYER_CONTRIBUTION: row.monto,
            },
            descriptions: {
              ASSOCIATED_SAVINGS: `DIFERENCIA AHORRO DEL ${dateCell}`,
              // EMPLOYER_CONTRIBUTION: `APORTE DEL ${dateCell}`,
            },
          });
        }

        processedCount++;
      }

      if (processedCount > 0 && companyId) {
        // 1. Crear movimiento bancario unificado para todo el lote
        const dataBankBulk = {
          movement: {
            bankAccountId: dto.bankAccountId,
            transactionDate: dto.transactionDate ?? new Date(),
            paymentMethod: dto.paymentMethod as paymentMethodEnum,
            description:
              dto.description ??
              `Carga masiva: ${typeCell} - ${processedCount} registros`,
            bankReference: dto.referenceNumber,
            category: 'MEMBER_CONTRIBUTION' as BankTransactionCategory,
            creditAmount: totalAmountProcessed,
            debitAmount: 0,
            createdById: userId,
          },
          links: resultsAssociateMovements.map((m) => ({
            internalRecordType: 'MEMBER_CONTRIBUTION' as const,
            internalRecordId: m.id,
          })),
        };

        const bankResult = await this.bankMovementsService.createAndReconcile(
          dataBankBulk,
          userId,
          tx,
        );

        // 2. Actualizar los movimientos del asociado con el ID del banco
        for (const m of resultsAssociateMovements) {
          await tx
            .update(schema.associateAccountMovements)
            .set({
              referenceId: bankResult.movement.id.toString(),
              referenceType: 'BANK_TRANSACTION',
            })
            .where(eq(schema.associateAccountMovements.id, m.id));
        }

        // 3. Crear un solo asiento contable para todos los registrados
        try {
          await this.accountingEntriesService.createAutomaticEntry(
            userId,
            {
              companyId: Number(companyId),
              category: 'SAVINGS_BANK',
              operationType: 'PAYROLL_CONCEPT', // Regla general de carga de haberes
              description: `Carga masiva ${typeCell} - ${processedCount} asociados`,
              entryDate: dto.transactionDate ?? new Date(),
              referenceValue: referenceValueLookup,
              currencyCode: 'VES' as CurrencyCodeEnum,
              originReferenceId: bankResult.movement.id.toString(),
              originType: 'SAVINGS_BULK_LOAD',
              roleAliases:
                typeCell === 'APORTE EMPLEADOS'
                  ? {
                      SAVINGS_RECEIVABLE: 'ASSOCIATED_SAVINGS',
                      EMPLOYER_RECEIVABLE: 'EMPLOYER_CONTRIBUTION',
                    }
                  : {
                      SAVINGS_RECEIVABLE: 'ASSOCIATED_SAVINGS',
                    },

              items: accountingItems,
              globalDescriptions:
                typeCell === 'APORTE EMPLEADOS'
                  ? {
                      ASSOCIATED_SAVINGS: `APORTES SOCIO DEL ${dateCell}`,
                      EMPLOYER_CONTRIBUTION: `APORTE DEL PATRONO DEL ${dateCell}`,
                    }
                  : {
                      ASSOCIATED_SAVINGS: `DIFERENCIA AHORRO DEL ${dateCell}`,
                    },
            },
            tx,
          );
        } catch (error) {
          if (
            error instanceof BadRequestException &&
            error.message.includes('No existe una regla contable')
          ) {
            throw new BadRequestException(
              `El sistema está configurado para asientos automáticos, pero no existe una regla contable creada para procesar estos asientos. Por favor, contacte al administrador.`,
            );
          }
          throw error;
        }

        // Log auditoria unificado
        this.eventEmitter.emit(
          'audit.log',
          new AuditLogEvent({
            tableName: 'associate_account_movements',
            recordId: 'BULK_LOAD',
            action: 'DATA_IMPORT',
            userId,
            area: 'savings_banks',
            description: `Carga masiva de haberes procesada exitosamente. Tipo: ${typeCell}, Total registros: ${processedCount}.`,
            newData: { processedCount, type: typeCell },
          }),
        );
      } else {
        throw new BadRequestException(
          'Ningún asociado especificado en el archivo fue encontrado o es válido.',
        );
      }

      return {
        message: 'Proceso masivo completado',
        processedCount,
      };
    });
  }
}

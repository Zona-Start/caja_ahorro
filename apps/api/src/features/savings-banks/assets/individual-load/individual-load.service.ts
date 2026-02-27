import { AccountingEntriesService } from '@/features/accounting/accounting-entries/accounting-entries.service';
import { AuditLogEvent } from '@/features/audit/events/audit-log.event';
import { BankMovementsService } from '@/features/bankings/bank-movements/bank-movements.service';
import {
  AssociateMovementTypeEnum,
  BankTransactionCategory,
  CurrencyCodeEnum,
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
import { IndividualLoadDto } from './dto/create-individual-load.dto';

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

      // 2. Crear movimiento del asociado
      const payload = {
        associateAccountId: dto.associateAccountId,
        movementType: dto.movementType,
        amount: dto.amount,
        currencyCode: 'VES' as CurrencyCodeEnum,
        transactionDate: dto.transactionDate,
        description: dto.description,
        referenceType: 'BANK_TRANSACTION',
        referenceNumber: dto.referenceNumber,
      };

      const result = await this.associateMovementsService.create(
        userId,
        payload,
        tx,
      );

      if (dto.bankAccountId) {
        // 3. Crear movimiento bancario vinculado
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
            creditAmount: dto.amount,
            debitAmount: 0,
            createdById: userId,
          },
          links: [
            {
              internalRecordType: 'MEMBER_CONTRIBUTION',
              internalRecordId: result.data.id,
            },
          ],
        };
        const bankResult = await this.bankMovementsService.createAndReconcile(
          dataBank,
          userId,
          tx,
        );
        // 4. Actualizar el movimiento del asociado con el ID del banco
        await tx
          .update(schema.associateAccountMovements)
          .set({
            referenceId: bankResult.movement.id.toString(),
          })
          .where(eq(schema.associateAccountMovements.id, result.data.id));
      }

      // 5. Crear Asiento Contable Automático
      try {
        await this.accountingEntriesService.createAutomaticEntry(
          userId,
          {
            companyId: Number(companyId),
            category: 'SAVINGS_BANK',
            operationType: 'PAYROLL_CONCEPT', // Regla general de carga de haberes
            description:
              dto.description ||
              `Carga individual de haberes - ${account.associates.fullname}`,
            entryDate: dto.transactionDate ?? new Date(),
            currencyCode: 'VES' as CurrencyCodeEnum,
            originReferenceId: result.data.id.toString(),
            originType: 'SAVINGS_INDIVIDUAL_LOAD',
            items: [
              {
                associateId: account.associates.id,
                amounts: {
                  ASSOCIATED_ACCOUNT: Number(dto.amount), // Haber para el asociado
                  EMPLOYER_ACCOUNT: Number(dto.amount), // Debe para banco/caja
                },
              },
            ],
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

      // 6. Registro de Auditoría
      this.eventEmitter.emit(
        'audit.log',
        new AuditLogEvent({
          tableName: 'associate_account_movements',
          recordId: result.data.id.toString(),
          action: 'INSERT',
          userId,
          area: 'savings_banks',
          description: `Carga individual de haberes por ${dto.amount} Bs para asociado ${account.associates.fullname} (ID Asociado: ${account.associates.id})`,
          newData: {
            associateId: account.associates.id,
            amount: dto.amount,
          },
        }),
      );

      return {
        message:
          'Carga individual procesada exitosamente con su registro contable.',
        movementId: result.data.id,
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
    sheet.getCell('B1').value = '5501';
    sheet.getCell('A1').font = { bold: true };
    sheet.getCell('B1').font = { bold: true, color: { argb: 'FFFF0000' } };

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
  async createBulk(fileBuffer: Buffer, userId: number) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer as any);
    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
      throw new BadRequestException(
        'El archivo Excel está vacío o es inválido',
      );
    }

    const typeCell = String(worksheet.getCell('B1').value || '').trim();
    if (typeCell !== '5501' && typeCell !== '5800') {
      throw new BadRequestException(
        'El tipo de carga en la celda B1 debe ser 5501 o 5800',
      );
    }

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
      const accountingItems: Array<{
        associateId: number;
        amounts: { ASSOCIATED_ACCOUNT: number; EMPLOYER_ACCOUNT: number };
      }> = [];

      let companyId: number | null = null;

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
        if (typeCell === '5501') {
          // Aporte empleado
          await this.associateMovementsService.create(
            userId,
            {
              associateAccountId: associate.associateAccountId,
              movementType: 'SAVING_CONTRIBUTION' as AssociateMovementTypeEnum,
              amount: row.monto,
              currencyCode: 'VES' as CurrencyCodeEnum,
              transactionDate: new Date(),
              description: 'Carga Masiva - Aporte Empleado',
              referenceType: 'BULK_LOAD',
            },
            tx,
          );
          // Aporte patronal
          await this.associateMovementsService.create(
            userId,
            {
              associateAccountId: associate.associateAccountId,
              movementType:
                'EMPLOYER_CONTRIBUTION' as AssociateMovementTypeEnum,
              amount: row.monto,
              currencyCode: 'VES' as CurrencyCodeEnum,
              transactionDate: new Date(),
              description: 'Carga Masiva - Aporte Empleador',
              referenceType: 'BULK_LOAD',
            },
            tx,
          );

          accountingItems.push({
            associateId: associate.id,
            amounts: {
              ASSOCIATED_ACCOUNT: row.monto,
              EMPLOYER_ACCOUNT: row.monto,
            },
          });
        } else if (typeCell === '5800') {
          // Un solo movimiento
          await this.associateMovementsService.create(
            userId,
            {
              associateAccountId: associate.associateAccountId,
              movementType: 'SAVING_CONTRIBUTION' as AssociateMovementTypeEnum,
              amount: row.monto,
              currencyCode: 'VES' as CurrencyCodeEnum,
              transactionDate: new Date(),
              description: 'Carga Masiva - Aporte Único',
              referenceType: 'BULK_LOAD',
            },
            tx,
          );

          accountingItems.push({
            associateId: associate.id,
            amounts: {
              ASSOCIATED_ACCOUNT: row.monto,
              EMPLOYER_ACCOUNT: row.monto,
            },
          });
        }

        processedCount++;
      }

      if (processedCount > 0 && companyId) {
        // Crear un solo asiento contable para todos los registrados
        try {
          await this.accountingEntriesService.createAutomaticEntry(
            userId,
            {
              companyId: Number(companyId),
              category: 'SAVINGS_BANK',
              operationType: 'PAYROLL_CONCEPT', // Regla general de carga de haberes
              description: `Carga masiva de haberes (Tipo: ${typeCell}) - ${processedCount} registros`,
              entryDate: new Date(),
              currencyCode: 'VES' as CurrencyCodeEnum,
              originReferenceId: `BULK_${Date.now()}`,
              originType: 'SAVINGS_BULK_LOAD',
              items: accountingItems,
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

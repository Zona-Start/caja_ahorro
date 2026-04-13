import {
  associateAccounts,
  associates,
} from '@/database/schema/tables/savings-banks';
import { associateHaberesBalance } from '@/database/schema/views';
import { StatusEnum } from '@/types/enum';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as ExcelJS from 'exceljs';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import {
  bankDirectory,
  categoryType,
  currencies,
  systemSettings,
  typePayrolls,
} from 'src/database/index';
import { AuditLogEvent } from '../../audit/events/audit-log.event';
import { BulkUploadResult } from './dto/bulk-upload-associate.dto';
import { CreateAssociateAccountsDto } from './dto/create-associate-accounts.dto';
import { CreateAssociateDto } from './dto/create-associate.dto';
import { FilterAssociateDto } from './dto/filter-associate.dto';
import { UpdateAssociateDto } from './dto/update-associate.dto';
import { Associates } from './entities/entity';
import { PdfGeneratorService } from '@/common/modules/pdf-generator/pdf-generator.service';

@Injectable()
export class AssociatesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly eventEmitter: EventEmitter2,
    private readonly pdfService: PdfGeneratorService

  ) {}

  async create(userId: number, createAssociateDto: CreateAssociateDto) {
    const key = 'MONEDA';
    try {
      const result = await this.drizzle.transaction(async (tx) => {
        const setting = await tx.query.systemSettings.findFirst({
          where: eq(systemSettings.key, key),
        });

        if (!setting?.value) {
          throw new NotFoundException(
            `System setting with key "${key}" not found or has no value`,
          );
        }

        const currencyCode = await tx
          .select()
          .from(currencies)
          .where(eq(schema.currencies.id, Number(setting.value)));

        const existingAssociate = await tx
          .select()
          .from(associates)
          .where(eq(associates.cedula, createAssociateDto.cedula));

        if (existingAssociate.length !== 0) {
          throw new NotFoundException(
            `Associated with the ID ${createAssociateDto.cedula} already exists`,
          );
        }

        const associateData = {
          ...createAssociateDto,
          birthdate: createAssociateDto.birthdate?.toISOString() || null,
          dateAdmission: createAssociateDto.dateAdmission?.toISOString(),
          dateGraduation:
            createAssociateDto.dateGraduation?.toISOString() || null,
          baseSalary: createAssociateDto.baseSalary?.toString(),
          createdById: userId,
        };

        const insertAssociate = await tx
          .insert(associates)
          .values(associateData)
          .returning({
            id: associates.id,
            companyId: associates.companyId,
            cedula: associates.cedula,
            fullname: associates.fullname,
            nationality: associates.nationality,
            gender: associates.gender,
            birthdate: associates.birthdate,
            dateAdmission: associates.dateAdmission,
            dateGraduation: associates.dateGraduation,
            discountFrequencyId: associates.discountFrequencyId,
            status: associates.status,
            isPayrollCredit: associates.isPayrollCredit,
            localityId: associates.localityId,
            phone: associates.phone,
            email: associates.email,
            payrollTypeId: associates.payrollTypeId,
            associatedTypeId: associates.associatedTypeId,
            jobTitle: associates.jobTitle,
            baseSalary: associates.baseSalary,
          });

        const associateId = insertAssociate[0].id;

        const associateAccountData = {
          associateId,
          accountNumber: createAssociateDto.accountNumber,
          currencyCode: currencyCode[0].code,
          balance: (0).toString(),
          openingDate: new Date().toISOString(),
          bankDirectoryId: createAssociateDto.bankDirectoryId,
          status: createAssociateDto.status,
          createdById: userId,
        };

        const insertAssociateAccount = await tx
          .insert(associateAccounts)
          .values(associateAccountData)
          .returning({
            id: associateAccounts.id,
            accountNumber: associateAccounts.accountNumber,
            currencyCode: associateAccounts.currencyCode,
            balance: associateAccounts.balance,
            openingDate: associateAccounts.openingDate,
            bankDirectoryId: associateAccounts.bankDirectoryId,
            status: associateAccounts.status,
          });

        return {
          associate: insertAssociate[0],
          associateAccount: insertAssociateAccount[0],
        };
      });

      // Emitir evento de auditoría (carga individual)
      this.eventEmitter.emit(
        'audit.log',
        new AuditLogEvent({
          tableName: 'associates',
          recordId: String(result.associate.id),
          action: 'INSERT',
          userId,
          area: 'savings_banks',
          description: `Asociado creado individualmente: ${result.associate.fullname} (${result.associate.cedula})`,
          newData: result.associate,
        }),
      );

      return {
        ...result.associate,
        accountNumber: result.associateAccount.accountNumber,
        currencyCode: result.associateAccount.currencyCode,
        balance: result.associateAccount.balance,
        openingDate: result.associateAccount.openingDate,
        bankDirectoryId: result.associateAccount.bankDirectoryId,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Error generating created associate:', error);
      throw new InternalServerErrorException('Failed created associate.');
    }
  }

  async findAll(
    paginationDto: FilterAssociateDto,
  ): Promise<{ data: Associates[]; meta: any }> {
    const {
      page = 1,
      limit = 10,
      searchType = '',
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      status = '',
      payroll = '',
    } = paginationDto || {};

    const offset = (page - 1) * limit;

    let searchConditions: SQL<unknown>[] = [];

    if (search) {
      switch (searchType) {
        case 'cedula':
          searchConditions.push(ilike(associates.cedula, `%${search}%`));
          break;
        case 'fullname':
          searchConditions.push(ilike(associates.fullname, `%${search}%`));
          break;
      }
    }

    const dataPayroll = payroll === 'true' ? true : false;

    if (status) {
      searchConditions.push(eq(associates.status, status as StatusEnum));
    }

    if (payroll) {
      searchConditions.push(eq(associates.isPayrollCredit, dataPayroll));
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    const orderBy =
      sortOrder === 'asc'
        ? sql`${associates[sortBy as keyof typeof associates]} asc`
        : sql`${associates[sortBy as keyof typeof associates]} desc`;

    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(associates)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    const data = await this.drizzle
      .select({
        id: associates.id,
        companyId: associates.companyId,
        cedula: associates.cedula,
        fullname: associates.fullname,
        nationality: associates.nationality,
        gender: associates.gender,
        birthdate: associates.birthdate,
        dateAdmission: associates.dateAdmission,
        dateGraduation: associates.dateGraduation,
        discountFrequencyId: associates.discountFrequencyId,
        status: associates.status,
        isPayrollCredit: associates.isPayrollCredit,
        localityId: associates.localityId,
        phone: associates.phone,
        email: associates.email,
        payrollTypeId: associates.payrollTypeId,
        associatedTypeId: associates.associatedTypeId,
        jobTitle: associates.jobTitle,
        baseSalary: associates.baseSalary,
        accountNumber: associateAccounts.accountNumber,
        currencyCode: associateAccounts.currencyCode,
        balance: associateAccounts.balance,
        openingDate: associateAccounts.openingDate,
        bankDirectoryId: associateAccounts.bankDirectoryId,
      })
      .from(associates)
      .where(searchCondition)
      .leftJoin(
        associateAccounts,
        eq(associateAccounts.associateId, associates.id),
      )
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const meta = {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
    };

    return {
      data: data.map((associate): any => ({
        ...associate,
        birthdate: associate.birthdate,
      })),
      meta,
    };
  }

  async findAllBySavingsBank(companyId: number) {
    return await this.drizzle
      .select()
      .from(associates)
      .where(eq(associates.companyId, companyId));
  }

  async findOne(id: number) {
    const result = await this.drizzle
      .select({
        id: associates.id,
        companyId: associates.companyId,
        cedula: associates.cedula,
        fullname: associates.fullname,
        nationality: associates.nationality,
        gender: associates.gender,
        birthdate: associates.birthdate,
        dateAdmission: associates.dateAdmission,
        dateGraduation: associates.dateGraduation,
        discountFrequencyId: associates.discountFrequencyId,
        status: associates.status,
        isPayrollCredit: associates.isPayrollCredit,
        localityId: associates.localityId,
        phone: associates.phone,
        email: associates.email,
        payrollTypeId: associates.payrollTypeId,
        associatedTypeId: associates.associatedTypeId,
        jobTitle: associates.jobTitle,
        baseSalary: associates.baseSalary,
        accountNumber: associateAccounts.accountNumber,
        currencyCode: associateAccounts.currencyCode,
        balance: associateAccounts.balance,
        openingDate: associateAccounts.openingDate,
        bankDirectoryId: associateAccounts.bankDirectoryId,
      })
      .from(associates)
      .where(eq(associates.id, id))
      .leftJoin(associateAccounts, eq(associateAccounts.associateId, id));

    if (!result.length) {
      throw new NotFoundException(`Associate with ID ${id} not found`);
    }

    return result[0];
  }

  async findByCedula(cedula: string) {
    const result = await this.drizzle
      .select({
        id: associates.id,
        companyId: associates.companyId,
        cedula: associates.cedula,
        fullname: associates.fullname,
        nationality: associates.nationality,
        gender: associates.gender,
        birthdate: associates.birthdate,
        dateAdmission: associates.dateAdmission,
        dateGraduation: associates.dateGraduation,
        discountFrequencyId: associates.discountFrequencyId,
        status: associates.status,
        isPayrollCredit: associates.isPayrollCredit,
        localityId: associates.localityId,
        phone: associates.phone,
        email: associates.email,
        payrollTypeId: associates.payrollTypeId,
        associatedTypeId: associates.associatedTypeId,
        jobTitle: associates.jobTitle,
        baseSalary: associates.baseSalary,
        associateAccountsId: associateAccounts.id,
        accountNumber: associateAccounts.accountNumber,
        currencyCode: associateAccounts.currencyCode,
        balance: associateHaberesBalance.haberesBalance,
        openingDate: associateAccounts.openingDate,
        bankDirectoryId: associateAccounts.bankDirectoryId,
      })
      .from(associates)
      .where(and(eq(associates.cedula, cedula)))
      .leftJoin(
        associateAccounts,
        eq(associateAccounts.associateId, associates.id),
      )
      .leftJoin(
        associateHaberesBalance,
        eq(associateHaberesBalance.associateAccountId, associateAccounts.id),
      );

    if (!result.length) {
      throw new NotFoundException(`Associate with cedula ${cedula} not found`);
    }

    if (result[0].status === 'INACTIVE') {
      throw new NotFoundException(
        `Associate with cedula ${cedula} is inactive`,
      );
    }

    if (result[0].status === 'RETIRED') {
      throw new NotFoundException(`Associate with cedula ${cedula} is retired`);
    }

    return {
      ...result[0],
      balance: Number(result[0].balance).toFixed(2),
    };
  }

  async getAssociateDetailsByCedula(cedula: string) {
    const result = await this.drizzle
      .select({
        id: associates.id,
        cedula: associates.cedula,
        fullname: associates.fullname,
        nationality: associates.nationality,
        gender: associates.gender,
        admissionDate: associates.dateAdmission,
        graduationDate: associates.dateGraduation,
        status: associates.status,
        isPayrollCredit: associates.isPayrollCredit,
        baseSalary: associates.baseSalary,
        locality: schema.states.name,
        accountNumber: associateAccounts.accountNumber,
        bankName: schema.bankDirectory.name,
        totalHaberes: associateHaberesBalance.haberesBalance,
      })
      .from(associates)
      .where(and(eq(associates.cedula, cedula)))
      .leftJoin(
        associateAccounts,
        eq(associateAccounts.associateId, associates.id),
      )
      .leftJoin(
        associateHaberesBalance,
        eq(associateHaberesBalance.associateAccountId, associateAccounts.id),
      )
      .leftJoin(schema.states, eq(associates.localityId, schema.states.id))
      .leftJoin(
        schema.bankDirectory,
        eq(associateAccounts.bankDirectoryId, schema.bankDirectory.id),
      );

    if (!result.length) {
      throw new NotFoundException(`Associate with cedula ${cedula} not found`);
    }

    const associateData = result[0];
    const paymentCapacity = parseFloat(associateData.baseSalary || '0') * 0.3;

    return {
      ...associateData,
      totalHaberes: Number(associateData.totalHaberes || 0).toFixed(2),
      paymentCapacity: paymentCapacity.toFixed(2),
    };
  }

  async update(
    userId: number,
    id: number,
    updateAssociateDto: UpdateAssociateDto,
  ) {
    const key = 'MONEDA';
    try {
      const result = await this.drizzle.transaction(async (tx) => {
        // 1. Validar que el asociado a actualizar existe
        const associateToUpdate = await tx.query.associates.findFirst({
          where: eq(associates.id, id),
        });

        if (!associateToUpdate) {
          throw new NotFoundException(`Associate with ID ${id} not found`);
        }

        // 2. Validar el estado del asociado
        const allowedStatusToUpdate = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
        if (!allowedStatusToUpdate.includes(associateToUpdate.status)) {
          throw new BadRequestException(
            `A partner with that status cannot be updated.`,
          );
        }

        const setting = await tx.query.systemSettings.findFirst({
          where: eq(systemSettings.key, key),
        });

        if (!setting?.value) {
          throw new NotFoundException(
            `System setting with key "${key}" not found or has no value`,
          );
        }

        const currencyCode = await tx
          .select()
          .from(currencies)
          .where(eq(schema.currencies.id, Number(setting.value)));

        const existingAssociate = await tx
          .select()
          .from(associates)
          .where(eq(associates.cedula, updateAssociateDto.cedula!));

        if (existingAssociate.length === 0) {
          throw new NotFoundException(
            `Associated with the ID ${updateAssociateDto.cedula} not exists`,
          );
        }

        const associateData = {
          ...updateAssociateDto,
          birthdate: updateAssociateDto.birthdate?.toISOString() || null,
          dateAdmission: updateAssociateDto.dateAdmission?.toISOString(),
          dateGraduation:
            updateAssociateDto.dateGraduation?.toISOString() || null,
          baseSalary: updateAssociateDto.baseSalary?.toString(),
          updatedById: userId,
        };

        const updateAssociate = await tx
          .update(associates)
          .set(associateData)
          .where(eq(associates.id, id))
          .returning({
            id: associates.id,
            companyId: associates.companyId,
            cedula: associates.cedula,
            fullname: associates.fullname,
            nationality: associates.nationality,
            gender: associates.gender,
            birthdate: associates.birthdate,
            dateAdmission: associates.dateAdmission,
            dateGraduation: associates.dateGraduation,
            discountFrequencyId: associates.discountFrequencyId,
            status: associates.status,
            isPayrollCredit: associates.isPayrollCredit,
            localityId: associates.localityId,
            phone: associates.phone,
            email: associates.email,
            payrollTypeId: associates.payrollTypeId,
            associatedTypeId: associates.associatedTypeId,
            jobTitle: associates.jobTitle,
            baseSalary: associates.baseSalary,
          });

        const associateAccountData = {
          accountNumber: updateAssociateDto.accountNumber,
          currencyCode: currencyCode[0].code,
          bankDirectoryId: updateAssociateDto.bankDirectoryId,
          status: updateAssociateDto.status,
          updatedById: userId,
        };

        const updateAsociateAccount = await tx
          .update(associateAccounts)
          .set(associateAccountData)
          .where(eq(associateAccounts.associateId, id))
          .returning({
            id: associateAccounts.id,
            accountNumber: associateAccounts.accountNumber,
            currencyCode: associateAccounts.currencyCode,
            balance: associateAccounts.balance,
            openingDate: associateAccounts.openingDate,
            bankDirectoryId: associateAccounts.bankDirectoryId,
            status: associateAccounts.status,
          });

        return {
          associate: updateAssociate[0],
          associateAccount: updateAsociateAccount[0],
        };
      });

      return {
        ...result.associate,
        accountNumber: result.associateAccount.accountNumber,
        currencyCode: result.associateAccount.currencyCode,
        balance: result.associateAccount.balance,
        openingDate: result.associateAccount.openingDate,
        bankDirectoryId: result.associateAccount.bankDirectoryId,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Error generating update associate:', error);
      throw new InternalServerErrorException('Failed update associate.');
    }
  }

  async remove(id: number) {
    const existingAssociate = await this.findOne(id);
    if (!existingAssociate) {
      throw new NotFoundException(`Associate with ID ${id} not found`);
    }

    if (
      existingAssociate.status === 'RETIRED' ||
      existingAssociate.status === 'ARCHIVED'
    ) {
      throw new BadRequestException(
        `You cannot delete a retired or archived partner because they are part of your history.`,
      );
    }

    const associateAccount =
      await this.drizzle.query.associateAccounts.findFirst({
        where: eq(schema.associateAccounts.associateId, id),
      });

    if (!associateAccount) {
      await this.drizzle
        .update(associates)
        .set({ status: 'INACTIVE' })
        .where(eq(associates.id, id));
      return { message: 'Associate set to INACTIVE successfully' };
    }

    const movements =
      await this.drizzle.query.associateAccountMovements.findMany({
        where: eq(
          schema.associateAccountMovements.associateAccountId,
          associateAccount.id,
        ),
      });

    if (
      movements.length === 1 &&
      movements[0].description === 'APERTURA CUENTA'
    ) {
      try {
        await this.drizzle.transaction(async (tx) => {
          await tx
            .delete(schema.associateAccountMovements)
            .where(
              eq(
                schema.associateAccountMovements.associateAccountId,
                associateAccount.id,
              ),
            );
          await tx
            .delete(schema.associateAccounts)
            .where(eq(schema.associateAccounts.associateId, id));
          await tx.delete(associates).where(eq(associates.id, id));
        });
        return { message: 'Associate deleted successfully' };
      } catch (error) {
        console.error('Error during hard delete of associate:', error);
        throw new InternalServerErrorException(
          'A problem occurred while permanently deleting the associate.',
        );
      }
    }

    if (movements.length > 0) {
      throw new BadRequestException(
        'The partner cannot be deleted because there are transactions in their account other than the opening transaction.',
      );
    }

    await this.drizzle
      .update(associates)
      .set({ status: 'INACTIVE' })
      .where(eq(associates.id, id));

    return { message: 'Associate set to INACTIVE successfully' };
  }

  async findByIdAssociateAccounts(id: number) {
    const result = await this.drizzle
      .select()
      .from(associateAccounts)
      .where(eq(associateAccounts.associateId, id));
    if (!result.length) {
      throw new NotFoundException(
        `By ID Associate Account with ID ${id} not found`,
      );
    }
    return result[0];
  }

  async createAssociateAccounts(
    userId: number,
    createAssociateAccountsDto: CreateAssociateAccountsDto,
  ) {
    const isExisting = await this.drizzle
      .select()
      .from(associateAccounts)
      .where(
        eq(
          associateAccounts.accountNumber,
          createAssociateAccountsDto.accountNumber,
        ),
      );

    if (isExisting.length !== 0) {
      throw new NotFoundException(
        `Associate Accounts with account number ${associateAccounts.accountNumber} exist`,
      );
    }

    const associateAccountData = {
      associateId: createAssociateAccountsDto.associateId,
      accountNumber: createAssociateAccountsDto.accountNumber,
      currencyCode: createAssociateAccountsDto.currencyCode,
      balance: (createAssociateAccountsDto.baseSalary * 0.1).toString(),
      openingDate: new Date(),
      bankDirectoryId: createAssociateAccountsDto.bankDirectoryId,
      status: createAssociateAccountsDto.status,
      createdById: userId,
    };
    const result = await this.drizzle
      .insert(associateAccounts)
      .values({
        ...associateAccountData,
        openingDate: associateAccountData.openingDate.toISOString(),
      })
      .returning();

    return result[0];
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // CARGA MASIVA
  // ──────────────────────────────────────────────────────────────────────────────

  async bulkUpload(
    userId: number,
    fileBuffer: Buffer,
  ): Promise<BulkUploadResult> {
    try {
      // 1. Obtener configuraciones previas una sola vez (fuera de la transacción para no bloquear)
      const {
        currencyCode,
        discountFrequencyId,
        payrollTypeId,
        bankId,
        companyId,
      } = await this._loadBulkUploadConfigs();

      // 2. Parsear el Excel
      const rows = await this._parseExcel(fileBuffer);

      if (rows.length === 0) {
        return { total: 0, inserted: 0, skipped: 0 };
      }

      let inserted = 0;
      let skipped = 0;
      const total = rows.length;

      // 3. Inserción atómica de todas las filas dentro de una transacción
      await this.drizzle.transaction(async (tx) => {
        for (const row of rows) {
          // Verificar si ya existe
          const existing = await tx
            .select({ id: associates.id })
            .from(associates)
            .where(eq(associates.cedula, row.cedula));

          if (existing.length > 0) {
            skipped++;
            continue;
          }

          // Determinar associatedTypeId buscando por contrato
          let associatedTypeId: number | undefined;
          if (row.contrato) {
            const catType = await tx
              .select({ id: categoryType.id })
              .from(categoryType)
              .where(
                and(
                  eq(categoryType.group, 'ASSOCIATED_TYPE'),
                  ilike(categoryType.description, `%${row.contrato}%`),
                ),
              );
            associatedTypeId = catType[0]?.id;
          }
  
          

          // Insertar asociado
          const [insertedAssociate] = await tx
            .insert(associates)
            .values({
              companyId: companyId ?? null,
              cedula: row.cedula,
              fullname: row.fullname,
              nationality: row.nationality as any,
              gender: row.gender as any,
              birthdate: row.fechaNacimiento,
              dateAdmission: row.fechaIngreso,
              status: 'ACTIVE' as any,
              isPayrollCredit: false,
              phone: row.telefono || null,
              email: row.correo || null,
              discountFrequencyId: discountFrequencyId ?? null,
              payrollTypeId: payrollTypeId ?? null,
              associatedTypeId: associatedTypeId ?? null,
              jobTitle: row.cargo,
              baseSalary: row.sueldo?.toString(),
              createdById: userId,
            } as any)
            .returning({
              id: associates.id,
              fullname: associates.fullname,
              cedula: associates.cedula,
            });
          // Removed extra comma here

          // Insertar cuenta del asociado
          await tx.insert(associateAccounts).values({
            associateId: insertedAssociate.id,
            accountNumber: row.nroCuenta,
            currencyCode,
            balance: '0',
            openingDate: new Date().toISOString(),
            bankDirectoryId: bankId,
            status: 'ACTIVE',
            createdById: userId,
          });

          inserted++;
        }
      });

      // 4. Emitir evento de auditoría para la carga masiva
      this.eventEmitter.emit(
        'audit.log',
        new AuditLogEvent({
          tableName: 'associates',
          recordId: 'bulk',
          action: 'DATA_IMPORT',
          userId,
          area: 'savings_banks',
          description: `Carga masiva de asociados: ${total} registros en archivo, ${inserted} insertados, ${skipped} omitidos (ya existían).`,
          newData: { total, inserted, skipped },
        }),
      );

      return { total, inserted, skipped };
    } catch (error) {
      console.error('Error en carga masiva de asociados:', error);
      throw new InternalServerErrorException(
        'Error procesando la carga masiva. Contacte al administrador.',
      );
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // Métodos auxiliares privados
  // ──────────────────────────────────────────────────────────────────────────────

  private async _loadBulkUploadConfigs(): Promise<{
    currencyCode: any;
    discountFrequencyId: number | undefined;
    payrollTypeId: number | undefined;
    bankId: number | undefined;
    companyId: number | undefined;
  }> {
    // Compañía (se toma la primera de la tabla - caja de ahorro única)
    const [comp] = await this.drizzle
      .select({ id: schema.company.id })
      .from(schema.company)
      .limit(1);
    const companyId = comp?.id;

    // Moneda
    const moneySetting = await this.drizzle.query.systemSettings.findFirst({
      where: eq(systemSettings.key, 'MONEDA'),
    });
    if (!moneySetting?.value) {
      throw new NotFoundException(
        'System setting with key "MONEDA" not found or has no value',
      );
    }
    const [currency] = await this.drizzle
      .select({ code: currencies.code })
      .from(currencies)
      .where(eq(schema.currencies.id, Number(moneySetting.value)));

    const currencyCode = currency?.code;

    // Frecuencia de descuento
    const freqSetting = await this.drizzle.query.systemSettings.findFirst({
      where: eq(systemSettings.key, 'FRECUENCIA-DESCUENTO'),
    });
    let discountFrequencyId: number | undefined;
    if (freqSetting?.value) {
      const [catFreq] = await this.drizzle
        .select({ id: categoryType.id })
        .from(categoryType)
        .where(
          and(
            eq(categoryType.group, 'DISCOUNT_FREQ'),
            eq(categoryType.description, freqSetting.value),
          ),
        );
      discountFrequencyId = catFreq?.id;
    }

    // Payroll type
    const payrollSetting = await this.drizzle.query.systemSettings.findFirst({
      where: eq(systemSettings.key, 'PAYROLL-DEFAULT'),
    });

    
    let payrollTypeId: number | undefined;
    if (payrollSetting?.value) {
      const [payroll] = await this.drizzle
        .select({ id: typePayrolls.id })
        .from(typePayrolls)
        .where(ilike(typePayrolls.description, `%${payrollSetting.value}%`));        
      payrollTypeId = payroll?.id;
    }

    // Banco (código 0175)
    const [bank] = await this.drizzle
      .select({ id: bankDirectory.id })
      .from(bankDirectory)
      .where(eq(bankDirectory.code, '0175'));
    const bankId = bank?.id;

    return {
      currencyCode,
      discountFrequencyId,
      payrollTypeId,
      bankId,
      companyId,
    };
  }

  private async _parseExcel(fileBuffer: Buffer): Promise<
    Array<{
      cedula: string;
      fullname: string;
      rif: string;
      nationality: string;
      gender: string;
      fechaNacimiento: string;
      telefono: string | undefined;
      correo: string | undefined;
      fechaIngreso: string;
      contrato: string;
      cargo: string;
      sueldo: number;
      nroCuenta: string;
    }>
  > {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer as any);

    const worksheet = workbook.worksheets[0];

    if (!worksheet) return [];

    const rows: any[] = [];

    worksheet.eachRow((row, rowNumber) => {
      // Saltar la primera fila (encabezados)
      if (rowNumber === 1) return;

      const cedula = this._cellValue(row.getCell(1));
      const rif = this._cellValue(row.getCell(2));
      const fullname = this._cellValue(row.getCell(3));
      const genero = this._cellValue(row.getCell(4))?.toUpperCase();
      const contrato = this._cellValue(row.getCell(5));
      const sueldo = parseFloat(this._cellValue(row.getCell(6)) || '0');
      const fechaIngreso = this._cellValue(row.getCell(7));
      const fechaNacimiento = this._cellValue(row.getCell(8));
      const cargo = this._cellValue(row.getCell(9));
      const nroCuenta = this._cellValue(row.getCell(10));

      if (!cedula || !fullname) return; // Saltar filas vacías

      // Mapear nationality desde rif
      const firstLetterRif = rif?.charAt(0)?.toUpperCase();
      const nationality =
        firstLetterRif === 'V'
          ? 'VENEZOLANO'
          : firstLetterRif === 'E'
            ? 'EXTRANJERO'
            : 'VENEZOLANO'; // default

      // Mapear gender
      const gender =
        genero === 'M'
          ? 'MASCULINO'
          : genero === 'F'
            ? 'FEMENINO'
            : 'MASCULINO'; // default

      const contract = contrato === 'GERENCIAL' ? 'NIVEL GERENCIAL' : contrato;

      rows.push({
        cedula,
        fullname,
        rif,
        nationality,
        gender,
        fechaNacimiento: this._formatDate(fechaNacimiento),
        fechaIngreso: this._formatDate(fechaIngreso),
        contrato: contract,
        cargo,
        sueldo,
        nroCuenta,
      });
    });

    return rows;
  }

  private _cellValue(cell: ExcelJS.Cell): string {
    const v = cell.value;
    if (v === null || v === undefined) return '';
    if (v instanceof Date) return v.toISOString().split('T')[0];
    if (typeof v === 'object' && 'richText' in v) {
      return (v as any).richText.map((r: any) => r.text).join('');
    }
    if (typeof v === 'object' && 'text' in v) {
      return String((v as any).text);
    }
    return String(v).trim();
  }

  private _formatDate(value: string): string {
    if (!value) return new Date().toISOString().split('T')[0];
    // Intentar parsear como fecha ISO o con slashes/guiones
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    return value;
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // Descarga de template Excel
  // ──────────────────────────────────────────────────────────────────────────────

  async generateTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Asociados');

    sheet.columns = [
      { header: 'cedula', key: 'cedula', width: 15 },
      { header: 'rif', key: 'rif', width: 15 },
      { header: 'nombre_apellido', key: 'fullname', width: 30 },
      { header: 'sexo', key: 'genero', width: 10 },
      { header: 'contrato', key: 'contrato', width: 20 },
      { header: 'sueldo', key: 'sueldo', width: 15 },
      { header: 'fecha_ingreso', key: 'fecha_ingreso', width: 20 },
      { header: 'fecha_nacimiento', key: 'fecha_nacimiento', width: 20 },
      { header: 'cargo', key: 'cargo', width: 20 },
      { header: 'cuenta_nomina', key: 'nro_cuenta', width: 25 },
    ];

    // Estilo para encabezados
    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F497D' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Fila de ejemplo (comentada para guía)
    sheet.addRow({
      cedula: '12345678',
      rif: 'V12345678',
      fullname: 'JUAN PÉREZ',
      genero: 'M',
      contrato: 'Empleados',
      sueldo: 5000,
      fecha_ingreso: '2024-01-01',
      fecha_nacimiento: '1990-01-15',
      cargo: 'ANALISTA',
      nro_cuenta: '01750000000000000001',
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer as ArrayBuffer);
  }



  // ──────────────────────────────────────────────────────────────────────────────
  // Descarga de asociados PDF
  // ──────────────────────────────────────────────────────────────────────────────

   async getReportsPdf(paginationDto?: FilterAssociateDto) {
    let rawData: any[];

    if (paginationDto) {
      // Si usas un findAll existente, extraemos los datos
      const payload = await this.findAll(paginationDto);
      rawData = payload.data;
    } else {
      // Consulta directa con Drizzle
      rawData = await this.drizzle
        .select({
          cedula: associates.cedula,
          fullname: associates.fullname,
          dateAdmission: associates.dateAdmission,
          status: associates.status,
          isPayrollCredit: associates.isPayrollCredit,
          jobTitle: associates.jobTitle,
          accountNumber: associateAccounts.accountNumber,
        })
        .from(associates)
        .leftJoin(
          associateAccounts,
          eq(associateAccounts.associateId, associates.id),
        );
    }

    // Transformamos los datos al formato que espera la tabla de pdfmake
    const tableBody = [
      // Fila 1: Encabezados
      ['Cédula', 'Nombre y Apellido', 'Ingreso', 'Estatus', 'Credi-Nomina', 'Cargo', 'Nro Cuenta'],
      // Filas de datos mapeadas
      ...rawData.map((item) => [
        item.cedula ?? 'N/A',
        item.fullname ?? 'N/A',
        item.dateAdmission ? new Date(item.dateAdmission).toLocaleDateString() : 'N/A',
        item.status ?? 'N/A',
        item.isPayrollCredit ? 'Sí' : 'No',
        item.jobTitle ?? 'N/A',
        item.accountNumber ?? 'Sin cuenta',
      ]),
    ];

    const content = {
      table: {
        headerRows: 1,
        widths: [60, '*', 65, 55, 45, 80, 100], 
        body: tableBody,
      },
      layout: 'lightHorizontalLines', // Opcional: mejora estética
    };

    return this.pdfService.generateReport('LISTADO DE ASOCIADOS', content, {
    orientation: 'landscape',
    pageSize: 'LETTER'
  });
  }

}

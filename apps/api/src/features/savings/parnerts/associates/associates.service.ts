import { PdfGeneratorService } from '@/common/modules/pdf-generator/pdf-generator.service';
import {
  associateAccounts,
  associates,
} from '@/database/schema/tables/savings';
import { associateHaberesBalance } from '@/database/schema/views';
import { AuditHelper } from '@/features/audit/audit-event.service';
import { CurrencyCodeEnum, StatusEnum } from '@/types/enum';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as ExcelJS from 'exceljs';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/schema';
import { bankDirectory } from 'src/database/schema';
import {
  CreateAssociateDto,
  UpdateAssociateDto,
} from './dto/create-associate.zod.dto';
import { FilterAssociateDto } from './dto/filter-associate.zod.dto';
import { Associates } from './entities/entity';

@Injectable()
export class AssociatesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly auditHelper: AuditHelper,
    private readonly pdfService: PdfGeneratorService,
  ) {}

  async create(tenantId: string, userId: string, dto: CreateAssociateDto) {
    const key = 'DEFAULT_CURRENCY';
    try {
      const result = await this.drizzle.transaction(async (tx) => {
        const setting = await tx.query.tenantSettings.findFirst({
          where: eq(schema.tenantSettings.key, key),
        });

        if (!setting?.value) {
          throw new NotFoundException(
            `System setting with key "${key}" not found or has no value`,
          );
        }

        const existingAssociate = await tx
          .select()
          .from(associates)
          .where(
            and(
              eq(associates.cedula, dto.cedula),
              eq(associates.tenantId, tenantId),
            ),
          );

        if (existingAssociate.length !== 0) {
          throw new NotFoundException(
            `Associate with the ID ${dto.cedula} already exists`,
          );
        }

        const associateData = {
          tenantId,
          cedula: dto.cedula,
          fullname: dto.fullname,
          nationality: dto.nationality,
          gender: dto.gender,
          birthdate: dto.birthdate?.toISOString()?.split('T')[0] || null,
          dateAdmission: dto.dateAdmission?.toISOString()?.split('T')[0],
          dateGraduation:
            dto.dateGraduation?.toISOString()?.split('T')[0] || null,
          discountFrequencyId: dto.discountFrequencyId,
          status: dto.status ?? StatusEnum.ACTIVE,
          isPayrollCredit: dto.isPayrollCredit ?? false,
          localityId: dto.localityId,
          phone: dto.phone,
          email: dto.email,
          payrollTypeId: dto.payrollTypeId,
          associatedTypeId: dto.associatedTypeId,
          jobTitle: dto.jobTitle,
          baseSalary: dto.baseSalary?.toString(),
          createdById: userId,
        };

        const insertAssociate = await tx
          .insert(associates)
          .values(associateData)
          .returning({
            id: associates.id,
            tenantId: associates.tenantId,
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
          accountNumber: dto.accountNumber,
          currencyCode: setting.value as CurrencyCodeEnum,
          balance: '0',
          openingDate: new Date().toISOString().split('T')[0],
          bankDirectoryId: dto.bankDirectoryId,
          status: dto.status ?? StatusEnum.ACTIVE,
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

      // Registra el log auditoria
      await this.auditHelper.logCreate(userId, 'associate', result, {
        targetId: result.associate.id,
        description: `Asociado creado: ${result.associate.fullname} (${result.associate.cedula})`,
        tenantId: tenantId,
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
      console.error('Error generating created associate:', error);
      throw new InternalServerErrorException('Failed created associate.');
    }
  }

  async findAll(
    tenantId: string,
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
    } = (paginationDto as any) || {};

    const offset = (page - 1) * limit;

    let searchConditions: SQL<unknown>[] = [];

    if (tenantId) {
      searchConditions.push(eq(associates.tenantId, tenantId));
    }

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
        tenantId: associates.tenantId,
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

  async findOne(tenantId: string, id: string) {
    const conditions: SQL<unknown>[] = [eq(associates.id, id)];
    if (tenantId) {
      conditions.push(eq(associates.tenantId, tenantId));
    }

    const result = await this.drizzle
      .select({
        id: associates.id,
        tenantId: associates.tenantId,
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
      .where(and(...conditions))
      .leftJoin(associateAccounts, eq(associateAccounts.associateId, associates.id));

    if (!result.length) {
      throw new NotFoundException(`Associate with ID ${id} not found`);
    }

    return result[0];
  }

  async findByCedula(tenantId: string, cedula: string) {
    const conditions: SQL<unknown>[] = [eq(associates.cedula, cedula)];
    if (tenantId) {
      conditions.push(eq(associates.tenantId, tenantId));
    }

    const result = await this.drizzle
      .select({
        id: associates.id,
        tenantId: associates.tenantId,
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
      .where(and(...conditions))
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

  async getAssociateDetailsByCedula(tenantId: string, cedula: string) {
    const conditions: SQL<unknown>[] = [eq(associates.cedula, cedula)];
    if (tenantId) {
      conditions.push(eq(associates.tenantId, tenantId));
    }

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
      .where(and(...conditions))
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
    tenantId: string,
    userId: string,
    id: string,
    dto: UpdateAssociateDto,
  ) {
    const key = 'DEFAULT_CURRENCY';
    try {
      const result = await this.drizzle.transaction(async (tx) => {
        const conditions: SQL<unknown>[] = [eq(associates.id, id)];
        if (tenantId) {
          conditions.push(eq(associates.tenantId, tenantId));
        }

        const associateToUpdate = await tx.query.associates.findFirst({
          where: and(...conditions),
        });

        if (!associateToUpdate) {
          throw new NotFoundException(`Associate with ID ${id} not found`);
        }

        const allowedStatusToUpdate = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
        if (!allowedStatusToUpdate.includes(associateToUpdate.status)) {
          throw new BadRequestException(
            `A partner with that status cannot be updated.`,
          );
        }

        const setting = await tx.query.tenantSettings.findFirst({
          where: eq(schema.tenantSettings.key, key),
        });

        if (!setting?.value) {
          throw new NotFoundException(
            `System setting with key "${key}" not found or has no value`,
          );
        }

        const associateData: any = {
          cedula: dto.cedula,
          fullname: dto.fullname,
          nationality: dto.nationality,
          gender: dto.gender,
          birthdate: dto.birthdate?.toISOString()?.split('T')[0] || null,
          dateAdmission: dto.dateAdmission?.toISOString()?.split('T')[0],
          dateGraduation:
            dto.dateGraduation?.toISOString()?.split('T')[0] || null,
          status: dto.status,
          isPayrollCredit: dto.isPayrollCredit,
          discountFrequencyId: dto.discountFrequencyId,
          localityId: dto.localityId,
          phone: dto.phone,
          email: dto.email,
          payrollTypeId: dto.payrollTypeId,
          associatedTypeId: dto.associatedTypeId,
          jobTitle: dto.jobTitle,
          baseSalary: dto.baseSalary?.toString(),
          updatedById: userId,
        };

        Object.keys(associateData).forEach((key) => {
          if (associateData[key] === undefined) {
            delete associateData[key];
          }
        });

        const updateAssociate = await tx
          .update(associates)
          .set(associateData)
          .where(and(...conditions))
          .returning({
            id: associates.id,
            tenantId: associates.tenantId,
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

        const associateAccountData: any = {
          updatedById: userId,
        };

        if (dto.accountNumber !== undefined) {
          associateAccountData.accountNumber = dto.accountNumber;
        }
        if (setting?.value) {
          associateAccountData.currencyCode = setting.value;
        }
        if (dto.bankDirectoryId !== undefined) {
          associateAccountData.bankDirectoryId = dto.bankDirectoryId;
        }
        if (dto.status !== undefined) {
          associateAccountData.status = dto.status;
        }

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
          associateAccount: updateAsociateAccount[0] ?? null,
        };
      });

      // Registra el log auditoria
      await this.auditHelper.logUpdate(userId, 'associate', result, {
        targetId: result.associate.id,
        description: `Asociado Actualizado: ${result.associate.fullname} (${result.associate.cedula})`,
        tenantId: tenantId,
      });

      return {
        ...result.associate,
        accountNumber: result.associateAccount?.accountNumber,
        currencyCode: result.associateAccount?.currencyCode,
        balance: result.associateAccount?.balance,
        openingDate: result.associateAccount?.openingDate,
        bankDirectoryId: result.associateAccount?.bankDirectoryId,
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

  async remove(tenantId: string, userId: string, id: string) {
    const existingAssociate = await this.findOne(tenantId, id);
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

    await this.drizzle.transaction(async (tx) => {
      const associateAccount =
        await tx.query.associateAccounts.findFirst({
          where: eq(schema.associateAccounts.associateId, id),
        });

      if (associateAccount) {
        const movements =
          await tx.query.associateAccountMovements.findMany({
            where: eq(
              schema.associateAccountMovements.associateAccountId,
              associateAccount.id,
            ),
          });

        if (movements.length > 0) {
          throw new BadRequestException(
            'The partner cannot be deleted because there are transactions in their account other than the opening transaction.',
          );
        }
      }

      await tx.delete(associates).where(eq(associates.id, id));
    });

    return { message: 'Associate deleted successfully' };
  }

  async inactive(tenantId: string, userId: string, id: string) {
    const existingAssociate = await this.findOne(tenantId, id);
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

    return this.drizzle.transaction(async (tx) => {
      const associateAccount =
        await tx.query.associateAccounts.findFirst({
          where: eq(schema.associateAccounts.associateId, id),
        });

      if (!associateAccount) {
        await tx
          .update(associates)
          .set({ status: 'INACTIVE' as any, updatedById: userId })
          .where(eq(associates.id, id));
        return { message: 'Associate set to INACTIVE successfully' };
      }

      const movements =
        await tx.query.associateAccountMovements.findMany({
          where: eq(
            schema.associateAccountMovements.associateAccountId,
            associateAccount.id,
          ),
        });

      if (
        movements.length === 1 &&
        movements[0].description === 'APERTURA CUENTA'
      ) {
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
        return { message: 'Associate deleted successfully' };
      }

      if (movements.length > 0) {
        throw new BadRequestException(
          'The partner cannot be deleted because there are transactions in their account other than the opening transaction.',
        );
      }

      await tx
        .update(associates)
        .set({ status: 'INACTIVE' as any, updatedById: userId })
        .where(eq(associates.id, id));

      return { message: 'Associate set to INACTIVE successfully' };
    }).then(async (result) => {
      // Registra el log auditoria (fuera de la transacción)
      await this.auditHelper.logUpdate(userId, 'associate', existingAssociate, {
        targetId: id,
        description: `Asociado INACTIVO: ${existingAssociate.fullname} (${existingAssociate.cedula})`,
        tenantId: tenantId,
      });
      return result;
    }).catch((error) => {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Error during inactive associate:', error);
      throw new InternalServerErrorException(
        'A problem occurred while inactivating the associate.',
      );
    });
  }

  async findByIdAssociateAccounts(tenantId: string, id: string) {
    const conditions: SQL<unknown>[] = [eq(associateAccounts.associateId, id)];
    if (tenantId) {
      const result = await this.drizzle
        .select()
        .from(associateAccounts)
        .innerJoin(associates, eq(associateAccounts.associateId, associates.id))
        .where(
          and(
            eq(associateAccounts.associateId, id),
            eq(associates.tenantId, tenantId),
          ),
        );

      if (!result.length) {
        throw new NotFoundException(
          `By ID Associate Account with ID ${id} not found`,
        );
      }

      return result[0].associate_accounts;
    }

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

  async createAssociateAccounts(tenantId: string, userId: string, dto: any) {
    return this.drizzle.transaction(async (tx) => {
      const isExisting = await tx
        .select()
        .from(associateAccounts)
        .where(eq(associateAccounts.accountNumber, dto.accountNumber));

      if (isExisting.length !== 0) {
        throw new NotFoundException(
          `Associate Accounts with account number ${dto.accountNumber} already exists`,
        );
      }

      const associateAccountData: any = {
        associateId: dto.associateId,
        accountNumber: dto.accountNumber,
        currencyCode: dto.currencyCode,
        balance: dto.balance?.toString() ?? '0.00',
        openingDate:
          dto.openingDate?.toISOString?.()?.split('T')[0] ??
          new Date().toISOString().split('T')[0],
        bankDirectoryId: dto.bankDirectoryId,
        status: dto.status,
        createdById: userId,
      };

      const result = await tx
        .insert(associateAccounts)
        .values(associateAccountData)
        .returning();

      return result[0];
    });
  }

  async bulkUpload(tenantId: string, userId: string, fileBuffer: Buffer) {
    try {
      const { currencyCode, discountFrequencyId, payrollTypeId, bankId } =
        await this._loadBulkUploadConfigs(tenantId);

      const rows = await this._parseExcel(fileBuffer);

      if (rows.length === 0) {
        return { total: 0, inserted: 0, skipped: 0 };
      }

      let inserted = 0;
      let skipped = 0;
      const total = rows.length;

      await this.drizzle.transaction(async (tx) => {
        for (const row of rows) {
          const existing = await tx
            .select({ id: associates.id })
            .from(associates)
            .where(
              and(
                eq(associates.cedula, row.cedula),
                eq(associates.tenantId, tenantId),
              ),
            );

          if (existing.length > 0) {
            skipped++;
            continue;
          }

          let associatedTypeId: string | undefined;
          if (row.contrato) {
            const catType = await tx
              .select({ id: schema.categories.id })
              .from(schema.categories)
              .where(
                and(
                  eq(schema.categories.tenantId, tenantId),
                  eq(schema.categories.type, 'associate_type'),
                  ilike(schema.categories.name, `%${row.contrato}%`),
                ),
              );
            associatedTypeId = catType[0]?.id;
          }

          const [insertedAssociate] = await tx
            .insert(associates)
            .values({
              tenantId,
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

          await tx.insert(associateAccounts).values({
            associateId: insertedAssociate.id,
            accountNumber: row.nroCuenta,
            currencyCode,
            balance: '0',
            openingDate: new Date().toISOString().split('T')[0],
            bankDirectoryId: bankId,
            status: 'ACTIVE',
            createdById: userId,
          });

          inserted++;
        }
      });

      // Registra el log auditoria
      await this.auditHelper.logCreate(userId, 'associate', rows, {
        targetId: `${total}`,
        description: `Carga masiva de asociados: ${total} registros en archivo, ${inserted} insertados, ${skipped} omitidos (ya existían).`,
        tenantId: tenantId,
      });

      return { total, inserted, skipped };
    } catch (error) {
      console.error('Error en carga masiva de asociados:', error);
      throw new InternalServerErrorException(
        'Error procesando la carga masiva. Contacte al administrador.',
      );
    }
  }

  private async _loadBulkUploadConfigs(tenantId: string): Promise<{
    currencyCode: any;
    discountFrequencyId: string | undefined;
    payrollTypeId: string | undefined;
    bankId: string | undefined;
  }> {
    const setting = await this.drizzle.query.tenantSettings.findFirst({
      where: eq(schema.tenantSettings.key, 'DEFAULT_CURRENCY'),
    });
    if (!setting?.value) {
      throw new NotFoundException(
        'System setting with key "MONEDA" not found or has no value',
      );
    }

    const currencyCode = setting?.value;

    const freqSetting = await this.drizzle.query.moduleSettings.findFirst({
      where: and(
        eq(schema.moduleSettings.tenantId, tenantId),
        eq(schema.moduleSettings.module, 'savings'),
        eq(schema.moduleSettings.submodule, 'contributions'),
        eq(schema.moduleSettings.key, 'DEFAULT_DISCOUNT_FREQUENCY'),
      ),
    });
    let discountFrequencyId: string | undefined;
    if (freqSetting?.value) {
      const [catFreq] = await this.drizzle
        .select({ id: schema.categories.id })
        .from(schema.categories)
        .where(
          and(
            eq(schema.categories.tenantId, tenantId),
            eq(schema.categories.type, 'discount_frequency'),
            eq(schema.categories.name, freqSetting.value),
          ),
        );
      discountFrequencyId = catFreq?.id;
    }

    const payrollSetting = await this.drizzle.query.moduleSettings.findFirst({
      where: and(
        eq(schema.moduleSettings.tenantId, tenantId),
        eq(schema.moduleSettings.module, 'savings'),
        eq(schema.moduleSettings.submodule, 'contributions'),
        eq(schema.moduleSettings.key, 'DEFAULT_PAYROLL_TYPE'),
      ),
    });

    let payrollTypeId: string | undefined;
    if (payrollSetting?.value) {
      const [payroll] = await this.drizzle
        .select({ id: schema.categories.id })
        .from(schema.categories)
        .where(
          and(
            eq(schema.categories.tenantId, tenantId),
            eq(schema.categories.type, 'payroll_type'),
            eq(schema.categories.code, payrollSetting.value),
          ),
        );
      payrollTypeId = payroll?.id;
    }

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

      if (!cedula || !fullname) return;

      const firstLetterRif = rif?.charAt(0)?.toUpperCase();
      const nationality =
        firstLetterRif === 'V'
          ? 'VENEZOLANO'
          : firstLetterRif === 'E'
            ? 'EXTRANJERO'
            : 'VENEZOLANO';

      const gender =
        genero === 'M'
          ? 'MASCULINO'
          : genero === 'F'
            ? 'FEMENINO'
            : 'MASCULINO';

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
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    return value;
  }

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

    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F497D' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

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

  async getReportsPdf(tenantId: string, paginationDto?: FilterAssociateDto) {
    let rawData: any[];

    if (paginationDto) {
      const payload = await this.findAll(tenantId, paginationDto);
      rawData = payload.data;
    } else {
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
        .where(tenantId ? eq(associates.tenantId, tenantId) : undefined)
        .leftJoin(
          associateAccounts,
          eq(associateAccounts.associateId, associates.id),
        );
    }

    const tableBody = [
      [
        'Cédula',
        'Nombre y Apellido',
        'Ingreso',
        'Estatus',
        'Credi-Nomina',
        'Cargo',
        'Nro Cuenta',
      ],
      ...rawData.map((item) => [
        item.cedula ?? 'N/A',
        item.fullname ?? 'N/A',
        item.dateAdmission
          ? new Date(item.dateAdmission).toLocaleDateString()
          : 'N/A',
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
      layout: 'lightHorizontalLines',
    };

    return this.pdfService.generateReport('LISTADO DE ASOCIADOS', content, {
      orientation: 'landscape',
      pageSize: 'LETTER',
    });
  }
}

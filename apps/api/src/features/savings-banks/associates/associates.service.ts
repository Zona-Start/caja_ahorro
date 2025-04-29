import { associateAccounts, associates } from '@/database/schema/savings-banks';
import { StatusEnum } from '@/types/enum';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { currencies, systemSettings } from 'src/database/index';
import { CreateAssociateAccountsDto } from './dto/create-associate-accounts.dto';
import { CreateAssociateDto } from './dto/create-associate.dto';
import { FilterAssociateDto } from './dto/filter-associate.dto';
import { UpdateAssociateDto } from './dto/update-associate.dto';
import { Associates } from './entities/entity';

@Injectable()
export class AssociatesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async create(userId: number, createAssociateDto: CreateAssociateDto) {
    const key = 'moneda';
    try {
      const result = await this.drizzle.transaction(async (tx) => {
        //genera un transaccion si ocurre un error no se guarda nada
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

        // Convert Date object to string format for database insertion
        const associateData = {
          ...createAssociateDto,
          birthdate: createAssociateDto.birthdate?.toISOString() || null,
          dateAdmission: createAssociateDto.dateAdmission?.toISOString(),
          dateGraduation:
            createAssociateDto.dateGraduation?.toISOString() || null,
          baseSalary: createAssociateDto.baseSalary?.toString(),
          createdById: userId,
        };
        const insertAssociate = await this.drizzle
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
        const associate = insertAssociate[0].id;

        const associateAccountData = {
          associateId: associate,
          accountNumber: createAssociateDto.accountNumber,
          currencyCode: currencyCode[0].code,
          balance: (createAssociateDto.baseSalary * 0.1).toString(),
          openingDate: new Date(),
          bankDirectoryId: createAssociateDto.bankDirectoryId,
          status: createAssociateDto.status,
          createdById: userId,
        };
        const insertAssociateAccount = await this.drizzle
          .insert(associateAccounts)
          .values({
            ...associateAccountData,
            openingDate: associateAccountData.openingDate.toISOString(),
          })
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
      return {
        ...result.associate,
        accountNumber: result.associateAccount.accountNumber,
        currencyCode: result.associateAccount.currencyCode,
        balance: result.associateAccount.balance,
        openingDate: result.associateAccount.openingDate,
        bankDirectoryId: result.associateAccount.bankDirectoryId,
      };
    } catch (error) {
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

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build search condition
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

    const dataPayroll = payroll === 'true' ? true : false; // Convert to uppercase for case-insensitive match

    if (status) {
      searchConditions.push(eq(associates.status, status as StatusEnum));
    }

    if (payroll) {
      searchConditions.push(eq(associates.isPayrollCredit, dataPayroll));
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    // Build sort condition
    const orderBy =
      sortOrder === 'asc'
        ? sql`${associates[sortBy as keyof typeof associates]} asc`
        : sql`${associates[sortBy as keyof typeof associates]} desc`;

    // Get total count for pagination
    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(associates)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated data
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

    // Build pagination metadata
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

  async update(
    userId: number,
    id: number,
    updateAssociateDto: UpdateAssociateDto,
  ) {
    const key = 'moneda';
    try {
      const result = await this.drizzle.transaction(async (tx) => {
        //genera un transaccion si ocurre un error no se guarda nada
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

        // Convert Date object to string format for database insertion
        const associateData = {
          ...updateAssociateDto,
          birthdate: updateAssociateDto.birthdate?.toISOString() || null,
          dateAdmission: updateAssociateDto.dateAdmission?.toISOString(),
          dateGraduation:
            updateAssociateDto.dateGraduation?.toISOString() || null,
          baseSalary: updateAssociateDto.baseSalary?.toString(),
          updatedById: userId,
        };
        const updateAssociate = await this.drizzle
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
        const updateAsociateAccount = await this.drizzle
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
      console.error('Error generating created associate:', error);
      throw new InternalServerErrorException('Failed created associate.');
    }
  }

  async remove(id: number) {
    const existingAssociate = await this.findOne(id);

    if (!existingAssociate) {
      throw new NotFoundException(`Associate with ID ${id} not found`);
    }
    await this.drizzle
      .update(associates)
      .set({
        status: 'INACTIVE',
      })
      .where(eq(associates.id, id));

    return { message: 'Associate deleted successfully' };
  }

  //ACCOUNT BY ID ASSOCIATE
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

    // Convert Date object to string format for database insertion
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
}

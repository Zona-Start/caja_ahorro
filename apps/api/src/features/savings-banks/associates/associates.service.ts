import { associateAccounts, associates } from '@/database/schema/savings-banks';
import { StatusEnum } from '@/types/enum';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
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
    const existingAssociate = await this.drizzle
      .select()
      .from(associates)
      .where(eq(associates.cedula, createAssociateDto.cedula));

    if (existingAssociate.length !== 0) {
      throw new NotFoundException(
        `Associate with cedula ${createAssociateDto.cedula} exist`,
      );
    }

    // Convert Date object to string format for database insertion
    const associateData = {
      ...createAssociateDto,
      birthdate: createAssociateDto.birthdate?.toISOString() || null,
      dateAdmission: createAssociateDto.dateAdmission?.toISOString(),
      dateGraduation: createAssociateDto.dateGraduation?.toISOString() || null,
      baseSalary: createAssociateDto.baseSalary?.toString(),
      createdById: userId,
    };
    const result = await this.drizzle
      .insert(associates)
      .values(associateData)
      .returning();

    return result[0];
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
      .select()
      .from(associates)
      .where(searchCondition)
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
        savingsBankId: associates.companyId,
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
        workerTypeId: associates.workerTypeId,
        jobTitle: associates.jobTitle,
        baseSalary: associates.baseSalary,
      })
      .from(associates)
      .where(eq(associates.id, id));
    if (!result.length) {
      throw new NotFoundException(`Associate with ID ${id} not found`);
    }
    return result[0];
  }

  async update(
    userId: number,
    id: number,
    updateAssociateDto: UpdateAssociateDto,
  ): Promise<Associates> {
    const existingAssociate = await this.findOne(id);

    if (!existingAssociate) {
      throw new NotFoundException(`Associate with ID ${id} not found`);
    }

    // Convert Date object to string format for database update
    const associateData = {
      ...updateAssociateDto,
      birthdate: updateAssociateDto.birthdate?.toISOString() || null,
      dateAdmission: updateAssociateDto.dateAdmission?.toISOString(),
      dateGraduation: updateAssociateDto.dateGraduation?.toISOString() || null,
      baseSalary: updateAssociateDto.baseSalary?.toString(),
      updatedById: userId,
    };

    const result = await this.drizzle
      .update(associates)
      .set(associateData)
      .where(eq(associates.id, id))
      .returning();
    const associate = result[0];
    return {
      ...associate,
      birthdate: associate.birthdate ? new Date(associate.birthdate) : null,
      dateAdmission: associate.dateAdmission
        ? new Date(associate.dateAdmission)
        : null,
      dateGraduation: associate.dateGraduation
        ? new Date(associate.dateGraduation)
        : null,
      baseSalary: associate.baseSalary ? Number(associate.baseSalary) : null,
    } as Associates;
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
      balance: (createAssociateAccountsDto.salaryTotal * 0.6).toString(),
      openingDate: new Date(),
      bankDirectoryId: createAssociateAccountsDto.bankDirectoryId,
      salary: createAssociateAccountsDto.salary?.toString(),
      salaryTotal: createAssociateAccountsDto.salaryTotal?.toString(),
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

import { services } from '@/database/schema/administration';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { CreateServiceDto } from './dto/create-service.dto';
import { FilterServiceDto } from './dto/filter-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async create(userId: number, data: CreateServiceDto) {
    const exitService = await this.drizzle
      .select()
      .from(services)
      .where(
        and(
          eq(services.name, data.name),
          eq(services.suppliersId, data.suppliersId),
        ),
      );

    if (exitService.length !== 0) {
      throw new BadRequestException(
        'Service with this name and supplier already exists',
      );
    }

    const newService = await this.drizzle
      .insert(services)
      .values({
        ...data,
        defaultCost: String(data.defaultCost),
        createdById: userId,
        status: 'ACTIVE',
      })
      .returning({
        id: services.id,
        name: services.name,
        description: services.description,
        suppliersId: services.suppliersId,
        defaultCost: services.defaultCost,
        status: services.status,
      });

    return newService[0];
  }

  async findAll(paginationDto: FilterServiceDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      name,
      suppliersId,
      status,
    } = paginationDto;
    const offset = (page - 1) * limit;

    let searchConditions: SQL<unknown>[] = [];
    if (search) {
      searchConditions.push(ilike(services.name, `%${search}%`));
    }
    if (name) {
      searchConditions.push(ilike(services.name, `%${name}%`));
    }
    if (suppliersId) {
      searchConditions.push(eq(services.suppliersId, Number(suppliersId)));
    }
    if (
      status &&
      (status === 'ACTIVE' || status === 'INACTIVE' || status === 'SUSPENDED')
    ) {
      searchConditions.push(eq(services.status, status));
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    const orderBy =
      sortOrder === 'asc'
        ? sql`${services[sortBy as keyof typeof services]} asc`
        : sql`${services[sortBy as keyof typeof services]} desc`;

    const data = await this.drizzle
      .select({
        id: services.id,
        name: services.name,
        description: services.description,
        suppliersId: services.suppliersId,
        suppliersName: schema.suppliers.name,
        defaultCost: services.defaultCost,
        status: services.status,
      })
      .from(services)
      .where(searchCondition)
      .leftJoin(schema.suppliers, eq(services.suppliersId, schema.suppliers.id))
      .offset(offset)
      .orderBy(orderBy)
      .limit(limit);
    // const data = await this.drizzle.query.services.findMany({
    //   where: searchCondition,
    //   limit: limit,
    //   offset: offset,
    //   orderBy: orderBy,
    //   with: {
    //     supplier: true,
    //   },
    // });

    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(services)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    const meta = {
      page: Number(page),
      limit: Number(limit),
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
    };

    return { data, meta };
  }

  async findOne(id: number) {
    const data = await this.drizzle.query.services.findFirst({
      where: eq(services.id, id),
      with: {
        supplier: true,
      },
    });

    if (!data) {
      throw new NotFoundException('Service not found');
    }

    return data;
  }

  async update(userId: number, id: number, data: UpdateServiceDto) {
    const exist = await this.drizzle.query.services.findFirst({
      where: eq(services.id, id),
    });

    if (!exist) {
      throw new NotFoundException('Service not found');
    }

    const updatedService = await this.drizzle
      .update(services)
      .set({
        ...data,
        defaultCost: String(data.defaultCost),
        status:
          data.status === 'ACTIVE' ||
          data.status === 'INACTIVE' ||
          data.status === 'SUSPENDED'
            ? data.status
            : undefined,
        updatedById: userId,
      })
      .where(eq(services.id, id))
      .returning();

    return updatedService[0];
  }

  async remove(id: number) {
    const exist = await this.drizzle.query.services.findFirst({
      where: eq(services.id, id),
    });

    if (!exist) {
      throw new NotFoundException('Service not found');
    }

    await this.drizzle.delete(services).where(eq(services.id, id));

    return { message: 'Service removed successfully' };
  }
}

import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { categories } from '@/database/schema';
import { AuditHelper } from '@/features/audit/audit-event.service';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, or, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  CategoryQueryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/categories.dto';

export const CATEGORY_TYPES = {
  ASSOCIATE_TYPE: 'associate_type',
  DISCOUNT_FREQUENCY: 'discount_frequency',
  PAYROLL_TYPE: 'payroll_type',
  NATIONALITY: 'nationality',
  GENDER: 'gender',
  DOCUMENT_TYPE: 'document_type',
  CIVIL_STATUS: 'civil_status',
  ACCOUNT_TYPE: 'account_type',
  TRANSACTION_TYPE: 'transaction_type',
} as const;

@Injectable()
export class CategoriesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly auditHelper: AuditHelper,
  ) { }

  async findAll(
    dto: CategoryQueryDto,
    currentTenantId?: string,
    tx?: NodePgDatabase<typeof schema>,
  ) {


    const db = tx ?? this.db;
    const { page = 1, limit = 10, search, type, isActive, tenantId } = dto;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];

    // Prioridad: tenantId del contexto (para admins), sino el del query (para superadmin)
    const effectiveTenantId = currentTenantId || tenantId;
    if (effectiveTenantId) {
      conditions.push(eq(categories.tenantId, effectiveTenantId));
    }

    if (type) conditions.push(eq(categories.type, type));
    if (isActive !== undefined)
      conditions.push(eq(categories.isActive, isActive === 'true' ? true : false));

    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(categories.name, searchTerm),
          ilike(categories.code, searchTerm),
          ilike(categories.description, searchTerm),
        ) as SQL,
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db.query.categories.findMany({
      where: whereClause,
      orderBy: (c, { asc }) => [asc(c.type), asc(c.name)],
      limit,
      offset,
    });

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(categories)
      .where(whereClause);

    const total = Number(totalResult?.count || 0);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(
    id: string,
    tenantId?: string,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.db;
    const condition = tenantId
      ? and(eq(categories.id, id), eq(categories.tenantId, tenantId))
      : eq(categories.id, id);

    const category = await db.query.categories.findFirst({
      where: condition,
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async findByCode(
    type: string,
    code: string,
    tenantId: string,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.db;
    return await db.query.categories.findFirst({
      where: (c, { and, eq }) =>
        and(eq(c.type, type), eq(c.code, code), eq(c.tenantId, tenantId)),
    });
  }

  async create(
    dto: CreateCategoryDto,
    tenantId: string,
    userId?: string,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.db;
    const existing = await this.findByCode(dto.type, dto.code, tenantId, db);
    if (existing) {
      throw new ConflictException(
        `Category ${dto.type}/${dto.code} already exists for this tenant`,
      );
    }

    const [category] = await db
      .insert(categories)
      .values({
        ...dto,
        tenantId: dto.tenantId || tenantId,
        metadata: dto.metadata ? dto.metadata : null,
        createdById: userId,
      } as any)
      .returning();

    await this.auditHelper.logCreate(tenantId, 'category', category, {
      targetId: category.id,
      description: `Created category ${category.name}`,
    });

    return category;
  }

  async update(
    id: string,
    dto: UpdateCategoryDto,
    tenantId?: string,
    userId?: string,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.db;
    const previous = await this.findById(id, tenantId, db);

    const [updated] = await db
      .update(categories)
      .set({ ...dto, updatedAt: new Date(), updatedById: userId } as any)
      .where(eq(categories.id, id))
      .returning();

    await this.auditHelper.logUpdate(tenantId, 'category', previous, updated, {
      targetId: id,
      description: `Updated category ${previous.name}`,
    });

    return updated;
  }

  async remove(
    id: string,
    tenantId: string,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.db;
    const previous = await this.findById(id, tenantId, db);
    await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.tenantId, tenantId)));

    await this.auditHelper.logDelete(previous.tenantId, 'category', previous, {
      targetId: id,
      description: `Deleted category ${previous.name}`,
    });

    return { message: 'Category deleted successfully' };
  }
}

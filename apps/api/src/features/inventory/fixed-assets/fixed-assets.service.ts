import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { fixedAssets } from '@/database/schema/tables/inventory';
import { AuditHelper } from '@/features/audit/audit-event.service';
import { FixedAssetPricesService } from '@/features/inventory/fixed-asset-prices/fixed-asset-prices.service';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  CreateFixedAssetDto,
  UpdateFixedAssetDto,
} from './dto/fixed-assets.schema';
import { FixedAssetPaginationDto } from './dto/pagination-fixed-asset.dto';

type FixedAssetSelect = typeof fixedAssets.$inferSelect;

@Injectable()
export class FixedAssetsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private db: NodePgDatabase<typeof schema>,
    private readonly fixedAssetPricesService: FixedAssetPricesService,
    private readonly generateCode: GenerateCodeService,
    private readonly auditHelper: AuditHelper,
  ) {}

  async create(
    dto: CreateFixedAssetDto,
    tenantId: string,
    userId: string,
  ): Promise<{
    id: string;
    name: string;
    assetCode: string;
    categoryId: string;
    status: string;
  }> {
    const [category] = await this.db
      .select()
      .from(schema.inventoriesCategories)
      .where(eq(schema.inventoriesCategories.id, dto.categoryId));

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const result = await this.db.transaction(async (tx) => {
      const assetData = {
        tenantId,
        categoryId: dto.categoryId,
        assetCode: await this.generateCode.generateGlobalCode(
          'DOC_ACT',
          tenantId,
          'inventory',
          'fixed_assets',
        ),
        name: dto.name,
        description: dto.description ?? null,
        serialNumber: dto.serialNumber ?? null,
        model: dto.model ?? null,
        brand: dto.brand ?? null,
        acquisitionDate: dto.acquisitionDate,
        assetStatus: dto.assetStatus ?? 'ACTIVE',
        usefulLifeYears: dto.usefulLifeYears ?? null,
        depreciationMethod: dto.depreciationMethod ?? null,
        accumulatedDepreciation:
          dto.accumulatedDepreciation?.toString() ?? '0.00',
        lastDepreciationDate: dto.lastDepreciationDate ?? null,
        disposalDate: dto.disposalDate ?? null,
        disposalReason: dto.disposalReason ?? null,
        disposalValue: dto.disposalValue?.toString() ?? null,
        createdById: userId,
      };

      const [newAsset] = await tx
        .insert(fixedAssets)
        .values(assetData)
        .returning({
          id: fixedAssets.id,
          name: fixedAssets.name,
          assetCode: fixedAssets.assetCode,
          categoryId: fixedAssets.categoryId,
          status: fixedAssets.assetStatus,
        });

      if (dto.baseCost !== 0) {
        await this.fixedAssetPricesService.create(
          {
            fixedAssetsId: newAsset.id,
            baseCost: dto.baseCost,
            otherCosts: dto.otherCosts,
            purchaseTax: dto.purchaseTax,
            startDate: dto.acquisitionDate,
            isActive: true,
          },
          userId,
          tenantId,
          tx,
        );
      }

      return newAsset;
    });

    await this.auditHelper.logCreate(userId, 'fixed_asset', result, {
      tenantId,
      targetId: result.id,
      description: `Created fixed asset ${result.name}`,
    });

    return result;
  }

  async findAllFixet(
    tenantId: string | null,
  ): Promise<{ id: string; name: string }[]> {
    const conditions: SQL<unknown>[] = [];

    if (tenantId) {
      conditions.push(eq(fixedAssets.tenantId, tenantId));
    }

    return this.db
      .select({
        id: fixedAssets.id,
        name: fixedAssets.name,
      })
      .from(fixedAssets)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
  }

  async findAllByPagination(
    tenantId: string | null,
    paginationDto?: FixedAssetPaginationDto,
  ): Promise<{
    data: Record<string, unknown>[];
    meta: Record<string, unknown>;
  }> {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'id',
      sortOrder = 'asc',
      typeCategory,
      status,
      startDate,
      endDate,
      brand,
      model,
    } = paginationDto || {};

    const offset = (page - 1) * limit;

    const searchConditions: SQL<unknown>[] = [];

    if (search) {
      searchConditions.push(
        sql`(${ilike(fixedAssets.name, `%${search}%`)} OR ${ilike(fixedAssets.assetCode, `%${search}%`)} OR ${ilike(fixedAssets.serialNumber, `%${search}%`)})`,
      );
    }

    if (typeCategory) {
      searchConditions.push(eq(fixedAssets.categoryId, typeCategory));
    }

    if (status) {
      searchConditions.push(
        eq(
          fixedAssets.assetStatus,
          status as (typeof fixedAssets.$inferInsert)['assetStatus'] & {},
        ),
      );
    }

    if (startDate && endDate) {
      searchConditions.push(
        sql`${fixedAssets.acquisitionDate} BETWEEN ${startDate} AND ${endDate}`,
      );
    } else if (startDate) {
      searchConditions.push(
        sql`${fixedAssets.acquisitionDate} >= ${startDate}`,
      );
    } else if (endDate) {
      searchConditions.push(sql`${fixedAssets.acquisitionDate} <= ${endDate}`);
    }

    if (brand) {
      searchConditions.push(ilike(fixedAssets.brand, `%${brand}%`));
    }

    if (model) {
      searchConditions.push(ilike(fixedAssets.model, `%${model}%`));
    }

    if (tenantId) {
      searchConditions.push(eq(fixedAssets.tenantId, tenantId));
    }

    const searchCondition = and(...searchConditions);

    const orderByColumn = fixedAssets[sortBy as keyof typeof fixedAssets];
    const orderByClause =
      sortOrder === 'asc'
        ? sql`${orderByColumn} asc`
        : sql`${orderByColumn} desc`;

    const data = await this.db
      .select({
        id: fixedAssets.id,
        categoryId: fixedAssets.categoryId,
        categoryName: schema.inventoriesCategories.name,
        assetCode: fixedAssets.assetCode,
        name: fixedAssets.name,
        description: fixedAssets.description,
        serialNumber: fixedAssets.serialNumber,
        model: fixedAssets.model,
        brand: fixedAssets.brand,
        acquisitionDate: fixedAssets.acquisitionDate,
        baseCost: schema.fixedAssetsPrices.baseCost,
        otherCosts: schema.fixedAssetsPrices.otherCosts,
        purchaseTax: schema.fixedAssetsPrices.purchaseTax,
        totalCost: schema.fixedAssetsPrices.totalCost,
        assetStatus: fixedAssets.assetStatus,
        usefulLifeYears: fixedAssets.usefulLifeYears,
        depreciationMethod: fixedAssets.depreciationMethod,
      })
      .from(fixedAssets)
      .leftJoin(
        schema.inventoriesCategories,
        eq(fixedAssets.categoryId, schema.inventoriesCategories.id),
      )
      .leftJoin(
        schema.fixedAssetsPrices,
        and(
          eq(schema.fixedAssetsPrices.fixedAssetsId, fixedAssets.id),
          eq(schema.fixedAssetsPrices.isActive, true),
        ),
      )
      .where(searchCondition)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    const totalCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(fixedAssets)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0]?.count ?? 0);
    const totalPages = Math.ceil(totalCount / limit);

    const formattedData = data.map((asset) => ({
      ...asset,
      baseCost: Number(asset.baseCost),
      otherCosts: Number(asset.otherCosts),
      purchaseTax: Number(asset.purchaseTax),
      acquisitionDate: asset.acquisitionDate
        ? new Date(asset.acquisitionDate as string)
        : null,
    }));

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

    return { data: formattedData, meta };
  }

  async findOne(
    id: string,
    tenantId: string | null,
  ): Promise<Record<string, unknown>> {
    const conditions = [eq(fixedAssets.id, id)];

    if (tenantId) {
      conditions.push(eq(fixedAssets.tenantId, tenantId));
    }

    const [result] = await this.db
      .select({
        id: fixedAssets.id,
        categoryId: fixedAssets.categoryId,
        categoryName: schema.inventoriesCategories.name,
        assetCode: fixedAssets.assetCode,
        name: fixedAssets.name,
        description: fixedAssets.description,
        serialNumber: fixedAssets.serialNumber,
        model: fixedAssets.model,
        brand: fixedAssets.brand,
        acquisitionDate: fixedAssets.acquisitionDate,
        baseCost: schema.fixedAssetsPrices.baseCost,
        otherCosts: schema.fixedAssetsPrices.otherCosts,
        totalCost: schema.fixedAssetsPrices.totalCost,
        purchaseTax: schema.fixedAssetsPrices.purchaseTax,
        assetStatus: fixedAssets.assetStatus,
        usefulLifeYears: fixedAssets.usefulLifeYears,
        depreciationMethod: fixedAssets.depreciationMethod,
        accumulatedDepreciation: fixedAssets.accumulatedDepreciation,
        lastDepreciationDate: fixedAssets.lastDepreciationDate,
        disposalDate: fixedAssets.disposalDate,
        disposalReason: fixedAssets.disposalReason,
        disposalValue: fixedAssets.disposalValue,
      })
      .from(fixedAssets)
      .leftJoin(
        schema.inventoriesCategories,
        eq(fixedAssets.categoryId, schema.inventoriesCategories.id),
      )
      .leftJoin(
        schema.fixedAssetsPrices,
        and(
          eq(schema.fixedAssetsPrices.fixedAssetsId, fixedAssets.id),
          eq(schema.fixedAssetsPrices.isActive, true),
        ),
      )
      .where(and(...conditions));

    if (!result) {
      throw new NotFoundException(`Fixed asset with ID ${id} not found`);
    }

    return {
      ...result,
      baseCost: result.baseCost ? String(result.baseCost) : null,
      otherCosts: result.otherCosts ? String(result.otherCosts) : null,
      purchaseTax: result.purchaseTax ? String(result.purchaseTax) : null,
      accumulatedDepreciation: result.accumulatedDepreciation
        ? String(result.accumulatedDepreciation)
        : null,
      disposalValue: result.disposalValue ? String(result.disposalValue) : null,
    };
  }

  async update(
    id: string,
    dto: UpdateFixedAssetDto,
    tenantId: string | null,
    userId: string,
  ): Promise<{
    id: string;
    name: string;
    description: string | null;
    categoryId: string | null;
    assetStatus: string | null;
  }> {
    const existing = await this.findOne(id, tenantId);
    const existingAsset = existing as FixedAssetSelect;

    if (dto.categoryId) {
      const [category] = await this.db
        .select()
        .from(schema.inventoriesCategories)
        .where(eq(schema.inventoriesCategories.id, dto.categoryId));

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    if (dto.assetCode && dto.assetCode !== existingAsset.assetCode) {
      const [duplicate] = await this.db
        .select()
        .from(fixedAssets)
        .where(eq(fixedAssets.assetCode, dto.assetCode))
        .limit(1);

      if (duplicate) {
        throw new BadRequestException(
          `Asset with code ${dto.assetCode} already exists`,
        );
      }
    }

    const result = await this.db.transaction(async (tx) => {
      const updateData: Record<string, unknown> = {
        updatedById: userId,
      };

      if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;
      if (dto.assetCode !== undefined) updateData.assetCode = dto.assetCode;
      if (dto.name !== undefined) updateData.name = dto.name;
      if (dto.description !== undefined)
        updateData.description = dto.description;
      if (dto.serialNumber !== undefined)
        updateData.serialNumber = dto.serialNumber;
      if (dto.model !== undefined) updateData.model = dto.model;
      if (dto.brand !== undefined) updateData.brand = dto.brand;
      if (dto.acquisitionDate !== undefined)
        updateData.acquisitionDate = dto.acquisitionDate;
      if (dto.assetStatus !== undefined)
        updateData.assetStatus = dto.assetStatus;
      if (dto.usefulLifeYears !== undefined)
        updateData.usefulLifeYears = dto.usefulLifeYears;
      if (dto.depreciationMethod !== undefined)
        updateData.depreciationMethod = dto.depreciationMethod;
      if (dto.accumulatedDepreciation !== undefined)
        updateData.accumulatedDepreciation =
          dto.accumulatedDepreciation.toString();
      if (dto.lastDepreciationDate !== undefined)
        updateData.lastDepreciationDate = dto.lastDepreciationDate;
      if (dto.disposalDate !== undefined)
        updateData.disposalDate = dto.disposalDate;
      if (dto.disposalReason !== undefined)
        updateData.disposalReason = dto.disposalReason;
      if (dto.disposalValue !== undefined)
        updateData.disposalValue = dto.disposalValue.toString();

      const whereConditions = [eq(fixedAssets.id, id)];
      if (tenantId) {
        whereConditions.push(eq(fixedAssets.tenantId, tenantId));
      }

      const [updated] = await tx
        .update(fixedAssets)
        .set(updateData)
        .where(and(...whereConditions))
        .returning({
          id: fixedAssets.id,
          name: fixedAssets.name,
          description: fixedAssets.description,
          categoryId: fixedAssets.categoryId,
          assetStatus: fixedAssets.assetStatus,
        });

      if (!updated) {
        throw new NotFoundException('Fixed asset not found after update');
      }

      if ((dto.baseCost ?? 0) > 0) {
        await this.fixedAssetPricesService.create(
          {
            fixedAssetsId: updated.id,
            baseCost: dto.baseCost ?? 0,
            otherCosts: dto.otherCosts ?? 0,
            purchaseTax: dto.purchaseTax,
            startDate:
              dto.acquisitionDate ?? new Date().toISOString().split('T')[0],
            isActive: true,
          },
          userId,
          existingAsset.tenantId,
          tx,
        );
      }

      return updated;
    });

    await this.auditHelper.logUpdate(
      userId,
      'fixed_asset',
      existingAsset,
      result,
      {
        tenantId: existingAsset.tenantId,
        targetId: result.id,
        description: `Updated fixed asset ${result.name}`,
      },
    );

    return result;
  }

  async remove(
    id: string,
    tenantId: string | null,
    userId: string,
  ): Promise<void> {
    const existing = await this.findOne(id, tenantId);
    const existingAsset = existing as FixedAssetSelect;

    const [exitPurchaseOrder] = await this.db
      .select()
      .from(schema.purchaseOrderItems)
      .where(eq(schema.purchaseOrderItems.itemId, id))
      .limit(1);

    if (exitPurchaseOrder) {
      throw new BadRequestException(
        'Cannot be deleted has active purchase orders',
      );
    }

    const [exitSupplierInvoice] = await this.db
      .select()
      .from(schema.supplierInvoiceItems)
      .where(eq(schema.supplierInvoiceItems.itemId, id))
      .limit(1);

    if (exitSupplierInvoice) {
      throw new BadRequestException(
        'Cannot be deleted, has active invoices received',
      );
    }

    const whereConditions = [eq(fixedAssets.id, id)];
    if (tenantId) {
      whereConditions.push(eq(fixedAssets.tenantId, tenantId));
    }

    await this.db.delete(fixedAssets).where(and(...whereConditions));

    await this.auditHelper.logDelete(userId, 'fixed_asset', existingAsset, {
      tenantId: existingAsset.tenantId,
      targetId: id,
      description: `Deleted fixed asset ${existingAsset.name}`,
    });
  }
}

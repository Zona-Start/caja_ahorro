import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { fixedAssets } from '@/database/schema/tables/inventory';
import { AuditHelper } from '@/features/audit/audit-event.service';
import { FixedAssetPricesService } from '@/features/inventory/fixed-asset-prices/fixed-asset-prices.service';
import { ProductServiceSuppliersService } from '@/features/inventory/product-service-suppliers/product-service-suppliers.service';
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
    private readonly productServiceSuppliersService: ProductServiceSuppliersService,
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
    assetStatus: string;
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
          'ACT',
          tenantId,
          'inventory',
          'assets',
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
          assetStatus: fixedAssets.assetStatus,
        });

      if ((dto.baseCost ?? 0) > 0 || (dto.otherCosts ?? 0) > 0) {
        await this.fixedAssetPricesService.create(
          {
            fixedAssetsId: newAsset.id,
            baseCost: dto.baseCost ?? 0,
            otherCosts: dto.otherCosts ?? 0,
            purchaseTax: dto.purchaseTax ?? undefined,
            startDate: dto.acquisitionDate,
            isActive: true,
          },
          userId,
          tenantId,
          tx,
        );
      }

      if (dto.suppliers && dto.suppliers.length > 0) {
        await this.productServiceSuppliersService.syncForFixedAsset(
          newAsset.id,
          dto.suppliers.map((s) => ({
            suppliersId: s.suppliersId,
            leadTimeDays: s.leadTimeDays ?? 0,
            preferred: s.preferred ?? false,
          })),
          tenantId,
          userId,
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

  async findAllFixed(
    tenantId: string | null,
  ): Promise<{ id: string; name: string; assetCode: string }[]> {
    const conditions: SQL<unknown>[] = [];

    if (tenantId) {
      conditions.push(eq(fixedAssets.tenantId, tenantId));
    }

    return this.db
      .select({
        id: fixedAssets.id,
        name: fixedAssets.name,
        assetCode: fixedAssets.assetCode,
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
      sortBy = 'createdAt',
      sortOrder = 'desc',
      categoryId: typeCategory,
      assetStatus: status,
      depreciationMethod,
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

    if (depreciationMethod) {
      searchConditions.push(
        eq(fixedAssets.depreciationMethod, depreciationMethod),
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
        tenantId: fixedAssets.tenantId,
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
        accumulatedDepreciation: fixedAssets.accumulatedDepreciation,
        lastDepreciationDate: fixedAssets.lastDepreciationDate,
        disposalDate: fixedAssets.disposalDate,
        disposalReason: fixedAssets.disposalReason,
        disposalValue: fixedAssets.disposalValue,
        createdAt: fixedAssets.createdAt,
        updatedAt: fixedAssets.updatedAt,
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
      baseCost: Number(asset.baseCost ?? 0),
      otherCosts: Number(asset.otherCosts ?? 0),
      purchaseTax: Number(asset.purchaseTax ?? 0),
      totalCost: Number(asset.totalCost ?? 0),
      accumulatedDepreciation: Number(asset.accumulatedDepreciation ?? 0),
      disposalValue: Number(asset.disposalValue ?? 0),
      acquisitionDate: asset.acquisitionDate
        ? new Date(asset.acquisitionDate as string).toISOString().split('T')[0]
        : null,
      lastDepreciationDate: asset.lastDepreciationDate
        ? new Date(asset.lastDepreciationDate as string)
            .toISOString()
            .split('T')[0]
        : null,
      disposalDate: asset.disposalDate
        ? new Date(asset.disposalDate as string).toISOString().split('T')[0]
        : null,
      createdAt: asset.createdAt
        ? new Date(asset.createdAt as unknown as string).toISOString()
        : null,
      updatedAt: asset.updatedAt
        ? new Date(asset.updatedAt as unknown as string).toISOString()
        : null,
    }));

    const meta = {
      totalCount,
      page,
      limit,
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
      const dtoClean = Object.fromEntries(
        Object.entries(dto).filter(([_, v]) => v !== undefined && v !== null),
      ) as Record<string, unknown>;

      const updateData: Record<string, unknown> = {
        updatedById: userId,
      };

      if (dtoClean.categoryId !== undefined)
        updateData.categoryId = dtoClean.categoryId;
      if (dtoClean.assetCode !== undefined)
        updateData.assetCode = dtoClean.assetCode;
      if (dtoClean.name !== undefined) updateData.name = dtoClean.name;
      if (dtoClean.description !== undefined)
        updateData.description = dtoClean.description;
      if (dtoClean.serialNumber !== undefined)
        updateData.serialNumber = dtoClean.serialNumber;
      if (dtoClean.model !== undefined) updateData.model = dtoClean.model;
      if (dtoClean.brand !== undefined) updateData.brand = dtoClean.brand;
      if (dtoClean.acquisitionDate !== undefined)
        updateData.acquisitionDate = dtoClean.acquisitionDate;
      if (dtoClean.assetStatus !== undefined)
        updateData.assetStatus = dtoClean.assetStatus;
      if (dtoClean.usefulLifeYears !== undefined)
        updateData.usefulLifeYears = dtoClean.usefulLifeYears;
      if (dtoClean.depreciationMethod !== undefined)
        updateData.depreciationMethod = dtoClean.depreciationMethod;
      if (dtoClean.accumulatedDepreciation !== undefined)
        updateData.accumulatedDepreciation = String(
          dtoClean.accumulatedDepreciation,
        );
      if (dtoClean.lastDepreciationDate !== undefined)
        updateData.lastDepreciationDate = dtoClean.lastDepreciationDate;
      if (dtoClean.disposalDate !== undefined)
        updateData.disposalDate = dtoClean.disposalDate;
      if (dtoClean.disposalReason !== undefined)
        updateData.disposalReason = dtoClean.disposalReason;
      if (dtoClean.disposalValue !== undefined)
        updateData.disposalValue = String(dtoClean.disposalValue);

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

      if ((dto.baseCost ?? 0) > 0 || (dto.otherCosts ?? 0) > 0) {
        await this.fixedAssetPricesService.create(
          {
            fixedAssetsId: updated.id,
            baseCost: dto.baseCost ?? 0,
            otherCosts: dto.otherCosts ?? 0,
            purchaseTax: dto.purchaseTax ?? undefined,
            startDate:
              dto.acquisitionDate ?? new Date().toISOString().split('T')[0],
            isActive: true,
          },
          userId,
          existingAsset.tenantId,
          tx,
        );
      }

      if (dto.suppliers !== undefined && dto.suppliers !== null) {
        await this.productServiceSuppliersService.syncForFixedAsset(
          updated.id,
          dto.suppliers.map((s) => ({
            suppliersId: s.suppliersId,
            leadTimeDays: s.leadTimeDays ?? 0,
            preferred: s.preferred ?? false,
          })),
          existingAsset.tenantId,
          userId,
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

    await this.db.transaction(async (tx) => {
      await this.fixedAssetPricesService.deactivateAllPricesForAsset(id, tx);

      await this.productServiceSuppliersService.deleteByFixedAssetId(
        id,
        existingAsset.tenantId,
        tx,
      );

      const whereConditions = [eq(fixedAssets.id, id)];
      if (existingAsset.tenantId) {
        whereConditions.push(eq(fixedAssets.tenantId, existingAsset.tenantId));
      }

      await tx.delete(fixedAssets).where(and(...whereConditions));
    });

    await this.auditHelper.logDelete(userId, 'fixed_asset', existingAsset, {
      tenantId: existingAsset.tenantId,
      targetId: id,
      description: `Deleted fixed asset ${existingAsset.name}`,
    });
  }
}

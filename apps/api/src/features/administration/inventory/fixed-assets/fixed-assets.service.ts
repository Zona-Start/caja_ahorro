import { GenerateCodeService } from '@/common/utils/generate-code/generate-code.service';
import {
  fixedAssets,
  purchaseOrderItems,
  supplierInvoiceItems,
} from '@/database/schema/administration';
import { fixedAssetsInventoryStatus } from '@/types/enum';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, sql, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { inventoriesCategories } from 'src/database/index';
import { FixedAssetPricesService } from '../fixed-asset-prices/fixed-asset-prices.service';
import { CreateFixedAssetDto } from './dto/create-fixed-asset.dto';
import { FilterFixedAssetDto } from './dto/filter-fixed-asset.dto';
import { UpdateFixedAssetDto } from './dto/update-fixed-asset.dto';
import { FixedAssetWithRelations } from './entities/fixed-asset.entity';

@Injectable()
export class FixedAssetsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly fixedAssetPricesService: FixedAssetPricesService,
    private readonly generateCode: GenerateCodeService,
  ) {}

  async create(userId: number, createFixedAssetDto: CreateFixedAssetDto) {
    // Verificar que la categoría existe
    const category = await this.drizzle
      .select()
      .from(inventoriesCategories)
      .where(eq(inventoriesCategories.id, createFixedAssetDto.categoryId));

    if (category.length === 0) {
      throw new NotFoundException(
        `Category with ID ${createFixedAssetDto.categoryId} not found`,
      );
    }

    // Verificar que el código de activo no esté duplicado
    const existingAsset = await this.drizzle.query.fixedAssets.findFirst({
      where: eq(fixedAssets.assetCode, createFixedAssetDto.assetCode),
    });

    if (existingAsset) {
      throw new BadRequestException(
        `Asset with code ${createFixedAssetDto.assetCode} already exists`,
      );
    }

    // Preparar datos para inserción
    const newFiexdAssets = await this.drizzle.transaction(async (tx) => {
      const assetData = {
        ...createFixedAssetDto,
        assetCode: await this.generateCode.generateGlobalCode('ACT'),
        assetStatus: 'ACTIVE' as fixedAssetsInventoryStatus,
        acquisitionDate: createFixedAssetDto.acquisitionDate.toISOString(),
        accumulatedDepreciation: createFixedAssetDto.accumulatedDepreciation
          ? createFixedAssetDto.accumulatedDepreciation.toString()
          : '0.00',
        lastDepreciationDate: createFixedAssetDto.lastDepreciationDate
          ? createFixedAssetDto.lastDepreciationDate.toISOString()
          : null,
        disposalDate: createFixedAssetDto.disposalDate
          ? createFixedAssetDto.disposalDate.toISOString()
          : null,
        disposalValue: createFixedAssetDto.disposalValue
          ? createFixedAssetDto.disposalValue.toString()
          : null,
        createdById: userId,
      };

      // Insertar el activo
      const result = await tx.insert(fixedAssets).values(assetData).returning({
        id: fixedAssets.id,
        name: fixedAssets.name,
        assetCode: fixedAssets.assetCode,
        categoryId: fixedAssets.categoryId,
        status: fixedAssets.assetStatus,
      });

      // Create initial fixed asset price entry
      if (createFixedAssetDto.baseCost !== 0) {
        await this.fixedAssetPricesService.create(
          userId,
          {
            fixedAssetsId: result[0].id,
            baseCost: createFixedAssetDto.baseCost,
            otherCosts: createFixedAssetDto.otherCosts, // Assuming 0 for now, can be added to DTO later
            purchaseTax: Number(createFixedAssetDto.purchaseTax ?? 0), // Assuming 0 for now, can be added to DTO later
            startDate: createFixedAssetDto.acquisitionDate,
            isActive: true,
          },
          tx,
        );
      }

      return result[0];
    });
    return newFiexdAssets[0];
  }

  async findAllFixet() {
    return this.drizzle
      .select({
        id: fixedAssets.id,
        name: fixedAssets.name,
      })
      .from(fixedAssets);
  }

  async findAll(filterDto: FilterFixedAssetDto) {
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
    } = filterDto;

    // Calcular offset para paginación
    const offset = (page - 1) * limit;

    // Construir condiciones de búsqueda
    let searchConditions: SQL<unknown>[] = [];

    if (search) {
      searchConditions.push(
        sql`(${ilike(fixedAssets.name, `%${search}%`)} OR 
              ${ilike(fixedAssets.assetCode, `%${search}%`)} OR 
              ${ilike(fixedAssets.serialNumber, `%${search}%`)})`,
      );
    }

    if (typeCategory) {
      searchConditions.push(eq(fixedAssets.categoryId, typeCategory));
    }

    if (status) {
      searchConditions.push(
        eq(fixedAssets.assetStatus, status as fixedAssetsInventoryStatus),
      );
    }

    if (startDate && endDate) {
      searchConditions.push(
        sql`${fixedAssets.acquisitionDate} BETWEEN ${startDate.toISOString()} AND ${endDate.toISOString()}`,
      );
    } else if (startDate) {
      searchConditions.push(
        sql`${fixedAssets.acquisitionDate} >= ${startDate.toISOString()}`,
      );
    } else if (endDate) {
      searchConditions.push(
        sql`${fixedAssets.acquisitionDate} <= ${endDate.toISOString()}`,
      );
    }

    if (brand) {
      searchConditions.push(ilike(fixedAssets.brand, `%${brand}%`));
    }

    if (model) {
      searchConditions.push(ilike(fixedAssets.model, `%${model}%`));
    }

    const searchCondition = searchConditions.length
      ? and(...searchConditions)
      : undefined;

    // Construir orden
    const orderBy =
      sortOrder === 'asc'
        ? sql`${fixedAssets[sortBy as keyof typeof fixedAssets]} asc`
        : sql`${fixedAssets[sortBy as keyof typeof fixedAssets]} desc`;

    // Obtener total para metadata de paginación
    const totalCountResult = await this.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(fixedAssets)
      .where(searchCondition);

    const totalCount = Number(totalCountResult[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Obtener datos paginados con join a categorías
    const data = await this.drizzle
      .select({
        id: fixedAssets.id,
        categoryId: fixedAssets.categoryId,
        categoryName: inventoriesCategories.name,
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
        inventoriesCategories,
        eq(fixedAssets.categoryId, inventoriesCategories.id),
      )
      .leftJoin(
        schema.fixedAssetsPrices,
        and(
          eq(schema.fixedAssetsPrices.fixedAssetsId, fixedAssets.id),
          eq(schema.fixedAssetsPrices.isActive, true),
        ),
      )
      .where(searchCondition)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Convertir valores numéricos de string a number
    const formattedData = data.map((asset) => ({
      ...asset,
      baseCost: Number(asset.baseCost),
      otherCosts: Number(asset.otherCosts),
      purchaseTax: Number(asset.purchaseTax),
      acquisitionDate: asset.acquisitionDate
        ? new Date(asset.acquisitionDate)
        : null,
    }));

    // Construir metadata de paginación
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
      data: formattedData,
      meta,
    };
  }

  async findOne(id: number): Promise<FixedAssetWithRelations> {
    try {
      const result = await this.drizzle
        .select({
          id: fixedAssets.id,
          categoryId: fixedAssets.categoryId,
          categoryName: inventoriesCategories.name,
          assetCode: fixedAssets.assetCode,
          name: fixedAssets.name,
          description: fixedAssets.description,
          serialNumber: fixedAssets.serialNumber,
          model: fixedAssets.model,
          brand: fixedAssets.brand,
          acquisitionDate: fixedAssets.acquisitionDate,
          baseCost: schema.servicePrices.baseCost,
          otherCosts: schema.servicePrices.otherCosts,
          totalCost: schema.servicePrices.totalCost,
          purchaseTax: schema.servicePrices.purchaseTax,
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
          inventoriesCategories,
          eq(fixedAssets.categoryId, inventoriesCategories.id),
        )
        .leftJoin(
          schema.fixedAssetsPrices,
          and(
            eq(schema.fixedAssetsPrices.fixedAssetsId, fixedAssets.id),
            eq(schema.fixedAssetsPrices.isActive, true),
          ),
        )
        .where(eq(fixedAssets.id, id));

      if (!result.length) {
        throw new NotFoundException(`Fixed asset with ID ${id} not found`);
      }

      // Convertir valores numéricos de string a number
      const asset = {
        ...result[0],
        categoryName: result[0].categoryName ? result[0].categoryName : null,
        baseCost: String(result[0].baseCost),
        otherCosts: String(result[0].otherCosts),
        purchaseTax: String(result[0].purchaseTax),
        accumulatedDepreciation: result[0].accumulatedDepreciation
          ? String(result[0].accumulatedDepreciation)
          : null,
        disposalValue: result[0].disposalValue
          ? String(result[0].disposalValue)
          : null,
        acquisitionDate: result[0].acquisitionDate,
        lastDepreciationDate: result[0].lastDepreciationDate
          ? result[0].lastDepreciationDate
          : null,
        disposalDate: result[0].disposalDate
          ? String(result[0].disposalDate)
          : null,
      };

      return asset;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error fetching fixed asset:', error);
      throw new InternalServerErrorException('Failed to fetch fixed asset');
    }
  }

  async update(
    userId: number,
    id: number,
    updateFixedAssetDto: UpdateFixedAssetDto,
  ) {
    // Verificar que el activo existe
    const existingAsset = await this.drizzle
      .select({
        id: fixedAssets.id,
        assetCode: fixedAssets.assetCode,
      })
      .from(fixedAssets)
      .where(eq(fixedAssets.id, id));

    if (existingAsset.length === 0) {
      throw new NotFoundException(`Fixed asset with ID ${id} not found`);
    }

    // Si se está actualizando la categoría, verificar que existe
    if (updateFixedAssetDto.categoryId) {
      const category = await this.drizzle
        .select()
        .from(inventoriesCategories)
        .where(eq(inventoriesCategories.id, updateFixedAssetDto.categoryId));

      if (category.length === 0) {
        throw new NotFoundException(
          `Category with ID ${updateFixedAssetDto.categoryId} not found`,
        );
      }
    }

    // Si se está actualizando el código de activo, verificar que no esté duplicado
    if (
      updateFixedAssetDto.assetCode &&
      updateFixedAssetDto.assetCode !== existingAsset[0].assetCode
    ) {
      const duplicateCode = await this.drizzle.query.fixedAssets.findFirst({
        where: eq(fixedAssets.assetCode, updateFixedAssetDto.assetCode),
      });

      if (duplicateCode) {
        throw new BadRequestException(
          `Asset with code ${updateFixedAssetDto.assetCode} already exists`,
        );
      }
    }

    // Handle purchase price update
    const updateFixedAsset = await this.drizzle.transaction(async (tx) => {
      // Preparar datos para actualización
      const updateData: any = { ...updateFixedAssetDto, updatedById: userId };

      // Convertir fechas y valores numéricos a formato adecuado
      if (updateFixedAssetDto.acquisitionDate) {
        updateData.acquisitionDate =
          updateFixedAssetDto.acquisitionDate.toISOString();
      }

      if (updateFixedAssetDto.lastDepreciationDate) {
        updateData.lastDepreciationDate =
          updateFixedAssetDto.lastDepreciationDate.toISOString();
      }

      if (updateFixedAssetDto.disposalDate) {
        updateData.disposalDate =
          updateFixedAssetDto.disposalDate.toISOString();
      }

      if (updateFixedAssetDto.accumulatedDepreciation !== undefined) {
        updateData.accumulatedDepreciation =
          updateFixedAssetDto.accumulatedDepreciation.toString();
      }

      if (updateFixedAssetDto.disposalValue !== undefined) {
        updateData.disposalValue = updateFixedAssetDto.disposalValue.toString();
      }
      // Actualizar el activo
      const result = await this.drizzle
        .update(fixedAssets)
        .set({
          categoryId: updateData.categoryId,
          assetCode: updateData.assetCode,
          name: updateData.name,
          description: updateData.description,
          serialNumber: updateData.serialNumber,
          model: updateData.model,
          brand: updateData.brand,
          acquisitionDate: updateData.acquisitionDate,
          assetStatus: updateData.assetStatus,
          usefulLifeYears: updateData.usefulLifeYears,
          depreciationMethod: updateData.depreciationMethod,
          accumulatedDepreciation: updateData.accumulatedDepreciation,
          lastDepreciationDate: updateData.lastDepreciationDate,
          disposalDate: updateData.disposalDate,
          disposalReason: updateData.disposalReason,
          disposalValue: updateData.disposalValue,
        })
        .where(eq(fixedAssets.id, id))
        .returning({
          id: fixedAssets.id,
          name: fixedAssets.name,
          description: fixedAssets.description,
          categoryId: fixedAssets.categoryId,
          assetStatus: fixedAssets.assetStatus,
        });

      if (updateFixedAssetDto.baseCost !== 0) {
        // Calculate final price based on settings
        await this.fixedAssetPricesService.create(
          userId,
          {
            fixedAssetsId: result[0].id,
            baseCost: updateData.baseCost ?? 0,
            otherCosts: updateData.otherCosts ?? 0, // Assuming 0 for now, can be added to DTO later
            purchaseTax: Number(updateData.purchaseTax ?? 0), // Assuming 0 for now, can be added to DTO later
            startDate: updateData.acquisitionDate ?? new Date(),
            isActive: true,
          },
          tx,
        );
      }
      return result;
    });

    return updateFixedAsset[0];
  }

  async remove(id: number) {
    // Verificar que el activo existe
    const existingAsset = await this.drizzle
      .select()
      .from(fixedAssets)
      .where(eq(fixedAssets.id, id));

    if (existingAsset.length === 0) {
      throw new NotFoundException(`Fixed asset with ID ${id} not found`);
    }

    const exitPurchaseOrder = await this.drizzle
      .select()
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.itemId, id));

    if (exitPurchaseOrder.length !== 0) {
      throw new BadRequestException(
        'Cannot be deleted has active purchase orders',
      );
    }

    const exitSupplierInvoice = await this.drizzle
      .select()
      .from(supplierInvoiceItems)
      .where(eq(supplierInvoiceItems.itemId, id));

    if (exitSupplierInvoice.length !== 0) {
      throw new BadRequestException(
        'Cannot be deleted, has active invoices received',
      );
    }

    // Eliminar el activo
    await this.drizzle.delete(fixedAssets).where(eq(fixedAssets.id, id));

    return {
      message: 'Fixed asset removed successfully',
    };
  }
}

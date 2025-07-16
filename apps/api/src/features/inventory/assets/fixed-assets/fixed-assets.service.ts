import { fixedAssetCategories, fixedAssets } from '@/database/schema/inventory';
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
import { CreateFixedAssetDto } from './dto/create-fixed-asset.dto';
import { FilterFixedAssetDto } from './dto/filter-fixed-asset.dto';
import { UpdateFixedAssetDto } from './dto/update-fixed-asset.dto';
import { FixedAssetWithRelations } from './entities/fixed-asset.entity';

@Injectable()
export class FixedAssetsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async create(userId: number, createFixedAssetDto: CreateFixedAssetDto) {
    try {
      // Verificar que la categoría existe
      const category = await this.drizzle.query.fixedAssetCategories.findFirst({
        where: eq(fixedAssetCategories.id, createFixedAssetDto.categoryId),
      });

      if (!category) {
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
      const assetData = {
        ...createFixedAssetDto,
        assetStatus: 'ACTIVE' as fixedAssetsInventoryStatus,
        acquisitionDate: createFixedAssetDto.acquisitionDate.toISOString(),
        purchasePrice: createFixedAssetDto.purchasePrice.toString(),
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
        currentStock: createFixedAssetDto.currentStock ?? 0,
        createdById: userId,
      };

      // Insertar el activo
      const result = await this.drizzle
        .insert(fixedAssets)
        .values(assetData)
        .returning();

      return {
        message: 'Fixed asset created successfully',
        data: result[0],
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Error creating fixed asset:', error);
      throw new InternalServerErrorException('Failed to create fixed asset');
    }
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
    try {
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
          categoryName: fixedAssetCategories.name,
          assetCode: fixedAssets.assetCode,
          name: fixedAssets.name,
          description: fixedAssets.description,
          serialNumber: fixedAssets.serialNumber,
          currentStock: fixedAssets.currentStock,
          model: fixedAssets.model,
          brand: fixedAssets.brand,
          acquisitionDate: fixedAssets.acquisitionDate,
          purchasePrice: fixedAssets.purchasePrice,
          assetStatus: fixedAssets.assetStatus,
          usefulLifeYears: fixedAssets.usefulLifeYears,
          depreciationMethod: fixedAssets.depreciationMethod,
        })
        .from(fixedAssets)
        .leftJoin(
          fixedAssetCategories,
          eq(fixedAssets.categoryId, fixedAssetCategories.id),
        )
        .where(searchCondition)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      // Convertir valores numéricos de string a number
      const formattedData = data.map((asset) => ({
        ...asset,
        purchasePrice: Number(asset.purchasePrice),
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
    } catch (error) {
      console.error('Error fetching fixed assets:', error);
      throw new InternalServerErrorException('Failed to fetch fixed assets');
    }
  }

  async findOne(id: number): Promise<FixedAssetWithRelations> {
    try {
      const result = await this.drizzle
        .select({
          id: fixedAssets.id,
          categoryId: fixedAssets.categoryId,
          categoryName: fixedAssetCategories.name,
          assetCode: fixedAssets.assetCode,
          name: fixedAssets.name,
          description: fixedAssets.description,
          serialNumber: fixedAssets.serialNumber,
          model: fixedAssets.model,
          brand: fixedAssets.brand,
          acquisitionDate: fixedAssets.acquisitionDate,
          purchasePrice: fixedAssets.purchasePrice,
          assetStatus: fixedAssets.assetStatus,
          usefulLifeYears: fixedAssets.usefulLifeYears,
          depreciationMethod: fixedAssets.depreciationMethod,
          accumulatedDepreciation: fixedAssets.accumulatedDepreciation,
          lastDepreciationDate: fixedAssets.lastDepreciationDate,
          disposalDate: fixedAssets.disposalDate,
          disposalReason: fixedAssets.disposalReason,
          disposalValue: fixedAssets.disposalValue,
          currentStock: fixedAssets.currentStock,
        })
        .from(fixedAssets)
        .leftJoin(
          fixedAssetCategories,
          eq(fixedAssets.categoryId, fixedAssetCategories.id),
        )
        .where(eq(fixedAssets.id, id));

      if (!result.length) {
        throw new NotFoundException(`Fixed asset with ID ${id} not found`);
      }

      // Convertir valores numéricos de string a number
      const asset = {
        ...result[0],
        categoryName: result[0].categoryName ? result[0].categoryName : null,
        purchasePrice: String(result[0].purchasePrice),
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
    try {
      // Verificar que el activo existe
      const existingAsset = await this.drizzle.query.fixedAssets.findFirst({
        where: eq(fixedAssets.id, id),
      });

      if (!existingAsset) {
        throw new NotFoundException(`Fixed asset with ID ${id} not found`);
      }

      // Si se está actualizando la categoría, verificar que existe
      if (updateFixedAssetDto.categoryId) {
        const category =
          await this.drizzle.query.fixedAssetCategories.findFirst({
            where: eq(fixedAssetCategories.id, updateFixedAssetDto.categoryId),
          });

        if (!category) {
          throw new NotFoundException(
            `Category with ID ${updateFixedAssetDto.categoryId} not found`,
          );
        }
      }

      // Si se está actualizando el código de activo, verificar que no esté duplicado
      if (
        updateFixedAssetDto.assetCode &&
        updateFixedAssetDto.assetCode !== existingAsset.assetCode
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

      if (updateFixedAssetDto.purchasePrice !== undefined) {
        updateData.purchasePrice = updateFixedAssetDto.purchasePrice.toString();
      }

      if (updateFixedAssetDto.accumulatedDepreciation !== undefined) {
        updateData.accumulatedDepreciation =
          updateFixedAssetDto.accumulatedDepreciation.toString();
      }

      if (updateFixedAssetDto.disposalValue !== undefined) {
        updateData.disposalValue = updateFixedAssetDto.disposalValue.toString();
      }

      // Actualizar el activo
      await this.drizzle
        .update(fixedAssets)
        .set(updateData)
        .where(eq(fixedAssets.id, id));

      return {
        message: 'Fixed asset updated successfully',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Error updating fixed asset:', error);
      throw new InternalServerErrorException('Failed to update fixed asset');
    }
  }

  async remove(id: number) {
    try {
      // Verificar que el activo existe
      const existingAsset = await this.drizzle.query.fixedAssets.findFirst({
        where: eq(fixedAssets.id, id),
      });

      if (!existingAsset) {
        throw new NotFoundException(`Fixed asset with ID ${id} not found`);
      }

      // Eliminar el activo
      await this.drizzle.delete(fixedAssets).where(eq(fixedAssets.id, id));

      return {
        message: 'Fixed asset removed successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error removing fixed asset:', error);
      throw new InternalServerErrorException('Failed to remove fixed asset');
    }
  }
}

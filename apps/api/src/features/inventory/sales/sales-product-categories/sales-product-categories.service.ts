import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/index';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateSalesProductCategoryDto } from './dto/create-sales-product-category.dto';
import { UpdateSalesProductCategoryDto } from './dto/update-sales-product-category.dto';
import { and, eq, isNull } from 'drizzle-orm';

@Injectable()
export class SalesProductCategoriesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async create(createSalesProductCategoryDto: CreateSalesProductCategoryDto) {
    const newCategory = await this.drizzle
      .insert(schema.salesProductCategories)
      .values(createSalesProductCategoryDto)
      .returning();

    return newCategory[0];
  }

  async findAll() {
    return this.drizzle.query.salesProductCategories.findMany({
      where: isNull(schema.salesProductCategories.deletedAt),
    });
  }

  async findOne(id: number) {
    const category = await this.drizzle.query.salesProductCategories.findFirst({
      where: and(
        eq(schema.salesProductCategories.id, id),
        isNull(schema.salesProductCategories.deletedAt),
      ),
    });

    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    return category;
  }

  async update(
    id: number,
    updateSalesProductCategoryDto: UpdateSalesProductCategoryDto,
  ) {
    await this.findOne(id);

    const updatedCategory = await this.drizzle
      .update(schema.salesProductCategories)
      .set(updateSalesProductCategoryDto)
      .where(eq(schema.salesProductCategories.id, id))
      .returning();

    return updatedCategory[0];
  }

  async remove(id: number) {
    await this.findOne(id);

    const deletedCategory = await this.drizzle
      .update(schema.salesProductCategories)
      .set({ deletedAt: new Date() })
      .where(eq(schema.salesProductCategories.id, id))
      .returning();

    return deletedCategory[0];
  }
}

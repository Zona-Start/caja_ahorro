import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/index';
import { categoryType } from '@/database/schema/general';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateCategoryTypeDto } from './dto/create-category-type.dto';
import { UpdateCategoryTypeDto } from './dto/update-category-type.dto';
import { CategoryType } from './entities/category-type.entity';

@Injectable()
export class CategoryTypesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async findAll(): Promise<CategoryType[]> {
    return await this.drizzle.select().from(categoryType);
  }

  async findOne(id: number): Promise<CategoryType> {
    const category = await this.drizzle
      .select()
      .from(categoryType)
      .where(eq(categoryType.id, id));

    if (category.length === 0) {
      throw new HttpException('Category type not found', HttpStatus.NOT_FOUND);
    }

    return category[0];
  }

  async findByGroup(group: string): Promise<CategoryType[]> {
    return await this.drizzle
      .select()
      .from(categoryType)
      .where(eq(categoryType.group, group));
  }

  async create(
    createCategoryTypeDto: CreateCategoryTypeDto,
  ): Promise<CategoryType> {
    const [category] = await this.drizzle
      .insert(categoryType)
      .values({
        group: createCategoryTypeDto.group,
        description: createCategoryTypeDto.description,
        options: createCategoryTypeDto.options,
      })
      .returning();

    return category;
  }

  async update(
    id: number,
    updateCategoryTypeDto: UpdateCategoryTypeDto,
  ): Promise<CategoryType> {
    // Check if category type exists
    await this.findOne(id);

    await this.drizzle
      .update(categoryType)
      .set({
        group: updateCategoryTypeDto.group,
        description: updateCategoryTypeDto.description,
        options: updateCategoryTypeDto.options,
      })
      .where(eq(categoryType.id, id));

    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    // Check if category type exists
    await this.findOne(id);

    await this.drizzle.delete(categoryType).where(eq(categoryType.id, id));

    return { message: 'Category type deleted successfully' };
  }
}

import { associates } from '@/database/schema/saving-banks';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import * as schema from 'src/database/index';
import { CreateAssociateDto } from './dto/create-associate.dto';
import { UpdateAssociateDto } from './dto/update-associate.dto';

@Injectable()
export class AssociatesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async create(createAssociateDto: CreateAssociateDto) {
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
      birthdate: createAssociateDto.birthdate.toISOString(),
    };

    const result = await this.drizzle
      .insert(associates)
      .values(associateData)
      .returning();

    return result[0];
  }

  async findAll() {
    return await this.drizzle.select().from(associates);
  }

  async findAllBySavingsBank(savingsBankId: number) {
    return await this.drizzle
      .select()
      .from(associates)
      .where(eq(associates.savingsBankId, savingsBankId));
  }

  async findOne(id: number) {
    const result = await this.drizzle
      .select()
      .from(associates)
      .where(eq(associates.id, id));

    if (!result.length) {
      throw new NotFoundException(`Associate with ID ${id} not found`);
    }

    return result[0];
  }

  async update(id: number, updateAssociateDto: UpdateAssociateDto) {
    const existingAssociate = await this.findOne(id);

    if (!existingAssociate) {
      throw new NotFoundException(`Associate with ID ${id} not found`);
    }

    // Convert Date object to string format for database insertion
    const associateData = {
      ...updateAssociateDto,
      birthdate: updateAssociateDto.birthdate
        ? updateAssociateDto.birthdate.toISOString()
        : undefined,
    };

    const result = await this.drizzle
      .update(associates)
      .set({
        ...associateData,
      })
      .where(eq(associates.id, id))
      .returning();

    return result[0];
  }

  async remove(id: number) {
    const existingAssociate = await this.findOne(id);

    if (!existingAssociate) {
      throw new NotFoundException(`Associate with ID ${id} not found`);
    }

    await this.drizzle.delete(associates).where(eq(associates.id, id));

    return { message: 'Associate deleted successfully' };
  }
}

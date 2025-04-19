import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/index';
import { municipalities, states } from '@/database/schema/core';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { StatesService } from '../states/states.service';
import { CreateMunicipalityDto } from './dto/create-municipality.dto';
import { UpdateMunicipalityDto } from './dto/update-municipality.dto';
import { Municipality } from './entities/municipality.entity';

@Injectable()
export class MunicipalitiesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private statesService: StatesService,
  ) {}

  async findAll(): Promise<Municipality[]> {
    return await this.drizzle
      .select({
        id: municipalities.id,
        name: municipalities.name,
        stateId: municipalities.stateId,
        stateName: states.name,
      })
      .from(municipalities)
      .leftJoin(states, eq(municipalities.stateId, states.id));
  }

  async findOne(id: number): Promise<Municipality> {
    const municipality = await this.drizzle
      .select({
        id: municipalities.id,
        name: municipalities.name,
        stateId: municipalities.stateId,
        stateName: states.name,
      })
      .from(municipalities)
      .leftJoin(states, eq(municipalities.stateId, states.id))
      .where(eq(municipalities.id, id));

    if (municipality.length === 0) {
      throw new HttpException('Municipality not found', HttpStatus.NOT_FOUND);
    }

    return municipality[0];
  }

  async findByState(stateId: number): Promise<Municipality[]> {
    // Verify state exists
    await this.statesService.findOne(stateId);

    return await this.drizzle
      .select({
        id: municipalities.id,
        name: municipalities.name,
        stateId: municipalities.stateId,
        stateName: states.name,
      })
      .from(municipalities)
      .leftJoin(states, eq(municipalities.stateId, states.id))
      .where(eq(municipalities.stateId, stateId));
  }

  async create(
    createMunicipalityDto: CreateMunicipalityDto,
  ): Promise<Municipality> {
    // Verify state exists
    await this.statesService.findOne(createMunicipalityDto.stateId);

    const [municipality] = await this.drizzle
      .insert(municipalities)
      .values({
        name: createMunicipalityDto.name,
        stateId: createMunicipalityDto.stateId,
      })
      .returning();

    return this.findOne(municipality.id);
  }

  async update(
    id: number,
    updateMunicipalityDto: UpdateMunicipalityDto,
  ): Promise<Municipality> {
    // Check if municipality exists
    await this.findOne(id);

    // If stateId is provided, verify it exists
    if (updateMunicipalityDto.stateId) {
      await this.statesService.findOne(updateMunicipalityDto.stateId);
    }

    await this.drizzle
      .update(municipalities)
      .set({
        name: updateMunicipalityDto.name,
        stateId: updateMunicipalityDto.stateId,
      })
      .where(eq(municipalities.id, id));

    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    // Check if municipality exists
    await this.findOne(id);

    await this.drizzle.delete(municipalities).where(eq(municipalities.id, id));

    return { message: 'Municipality deleted successfully' };
  }
}

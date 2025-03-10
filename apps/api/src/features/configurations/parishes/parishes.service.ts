import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/index';
import { municipalities, parishes } from '@/database/schema/general';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { MunicipalitiesService } from '../municipalities/municipalities.service';
import { CreateParishDto } from './dto/create-parish.dto';
import { UpdateParishDto } from './dto/update-parish.dto';
import { Parish } from './entities/parish.entity';

@Injectable()
export class ParishesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private municipalitiesService: MunicipalitiesService,
  ) {}

  async findAll(): Promise<Parish[]> {
    return await this.drizzle
      .select({
        id: parishes.id,
        name: parishes.name,
        municipalityId: parishes.municipalityId,
        municipalityName: municipalities.name,
        created_at: parishes.created_at,
        updated_at: parishes.updated_at,
      })
      .from(parishes)
      .leftJoin(municipalities, eq(parishes.municipalityId, municipalities.id));
  }

  async findOne(id: number): Promise<Parish> {
    const parish = await this.drizzle
      .select({
        id: parishes.id,
        name: parishes.name,
        municipalityId: parishes.municipalityId,
        municipalityName: municipalities.name,
        created_at: parishes.created_at,
        updated_at: parishes.updated_at,
      })
      .from(parishes)
      .leftJoin(municipalities, eq(parishes.municipalityId, municipalities.id))
      .where(eq(parishes.id, id));

    if (parish.length === 0) {
      throw new HttpException('Parish not found', HttpStatus.NOT_FOUND);
    }

    return parish[0];
  }

  async findByMunicipality(municipalityId: number): Promise<Parish[]> {
    // Verify municipality exists
    await this.municipalitiesService.findOne(municipalityId);

    return await this.drizzle
      .select({
        id: parishes.id,
        name: parishes.name,
        municipalityId: parishes.municipalityId,
        municipalityName: municipalities.name,
        created_at: parishes.created_at,
        updated_at: parishes.updated_at,
      })
      .from(parishes)
      .leftJoin(municipalities, eq(parishes.municipalityId, municipalities.id))
      .where(eq(parishes.municipalityId, municipalityId));
  }

  async create(createParishDto: CreateParishDto): Promise<Parish> {
    // Verify municipality exists
    await this.municipalitiesService.findOne(createParishDto.municipalityId);

    const [parish] = await this.drizzle
      .insert(parishes)
      .values({
        name: createParishDto.name,
        municipalityId: createParishDto.municipalityId,
      })
      .returning();

    return this.findOne(parish.id);
  }

  async update(id: number, updateParishDto: UpdateParishDto): Promise<Parish> {
    // Check if parish exists
    await this.findOne(id);

    // If municipalityId is provided, verify it exists
    if (updateParishDto.municipalityId) {
      await this.municipalitiesService.findOne(updateParishDto.municipalityId);
    }

    await this.drizzle
      .update(parishes)
      .set({
        name: updateParishDto.name,
        municipalityId: updateParishDto.municipalityId,
      })
      .where(eq(parishes.id, id));

    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    // Check if parish exists
    await this.findOne(id);

    await this.drizzle.delete(parishes).where(eq(parishes.id, id));

    return { message: 'Parish deleted successfully' };
  }
}

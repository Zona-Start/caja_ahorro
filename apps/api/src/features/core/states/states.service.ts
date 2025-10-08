import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/index';
import { states } from '@/database/schema/tables';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { eq, ne } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateStateDto } from './dto/create-state.dto';
import { UpdateStateDto } from './dto/update-state.dto';
import { State } from './entities/state.entity';

@Injectable()
export class StatesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async findAll(): Promise<State[]> {
    return await this.drizzle
      .select({
        id: states.id,
        name: states.name,
      })
      .from(states)
      .where(ne(states.id, 99));
  }

  async findOne(id: number): Promise<State> {
    const state = await this.drizzle
      .select()
      .from(states)
      .where(eq(states.id, id));

    if (state.length === 0) {
      throw new HttpException('State not found', HttpStatus.NOT_FOUND);
    }

    return state[0];
  }

  async create(createStateDto: CreateStateDto): Promise<State> {
    const [state] = await this.drizzle
      .insert(states)
      .values({
        name: createStateDto.name,
      })
      .returning();

    return state;
  }

  async update(id: number, updateStateDto: UpdateStateDto): Promise<State> {
    // Check if state exists
    await this.findOne(id);

    await this.drizzle
      .update(states)
      .set({
        name: updateStateDto.name,
      })
      .where(eq(states.id, id));

    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    // Check if state exists
    await this.findOne(id);

    await this.drizzle.delete(states).where(eq(states.id, id));

    return { message: 'State deleted successfully' };
  }
}

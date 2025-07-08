import { Inject, Injectable } from '@nestjs/common';

import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/database/index';
import { CreateBankMovementDto } from './dto';

@Injectable()
export class BankMovementsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async create(createBankMovementDto: CreateBankMovementDto) {
    // const [createdMovement] = await this.drizzle
    //   .insert(bankTransactions)
    //   .values(createBankMovementDto)
    //   .returning();
    // return createdMovement;
  }
}

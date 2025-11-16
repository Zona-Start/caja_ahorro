import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/database/index';
import { AccountPlanService } from '../account-plan/account-plan.service';
import { InitialLoadDto } from './dto/initial-load.dto';

@Injectable()
export class InitialBalanceService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly accountPlanService: AccountPlanService,
  ) {}

  async initialLoad(userId: number, initialLoadDto: InitialLoadDto) {
    const { balances } = initialLoadDto;

    // 1. Find the active accounting cycle for the current year.
    const currentYear = new Date().getFullYear();
    const firstDayOfYear = new Date(currentYear, 0, 1);
    const lastDayOfYear = new Date(currentYear, 11, 31);

    const [activeCycle] = await this.drizzle
      .select()
      .from(schema.accountingCycles)
      .where(
        and(
          eq(schema.accountingCycles.status, 'OPEN'),
          sql`EXTRACT(YEAR FROM ${schema.accountingCycles.startDate}) = ${currentYear}`,
        ),
      )
      .limit(1);

    if (!activeCycle) {
      throw new NotFoundException(
        'No active accounting cycle found for the current year.',
      );
    }

    // 2. Validate that the cycleBalances table is empty for that cycle.
    const existingBalances = await this.drizzle
      .select()
      .from(schema.accountBalances)
      .where(eq(schema.accountBalances.accountingCyclesId, activeCycle.id))
      .limit(1);

    if (existingBalances.length > 0) {
      throw new BadRequestException(
        'Initial balances have already been loaded for this cycle.',
      );
    }

    // 3. Iterate the received list and insert into accountBalances.
    return this.drizzle.transaction(async (tx) => {
      for (const balance of balances) {
        const [accountPlan] =
          await this.accountPlanService.findAccountPlanByCode(
            balance.accountCode,
          );

        if (!accountPlan) {
          throw new NotFoundException(
            `Account with code ${balance.accountCode} not found.`,
          );
        }

        await tx.insert(schema.accountBalances).values({
          companyId: activeCycle.companyId,
          accountPlanId: accountPlan.id,
          accountingCyclesId: activeCycle.id,
          initialBalance: String(balance.balance),
          createdById: userId,
        });
      }
      return { message: 'Initial balances loaded successfully' };
    });
  }
}

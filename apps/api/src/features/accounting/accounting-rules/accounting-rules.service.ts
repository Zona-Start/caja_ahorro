import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/index';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateAccountingRuleDto } from './dto/create-accounting-rule.dto';
import { UpdateAccountingRuleDto } from './dto/update-accounting-rule.dto';
import { AccountingRule } from './entities/accounting-rule.entity';

@Injectable()
export class AccountingRulesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
  ) {}

  async create(dto: CreateAccountingRuleDto): Promise<AccountingRule> {
    const rule: any = await this.drizzle.transaction(async (tx) => {
      const { details, ...ruleData } = dto;

      // 1. Create Rule
      const [rule] = await tx
        .insert(schema.accountingRules)
        .values(ruleData)
        .returning();

      // 2. Create Details
      if (details.length > 0) {
        const detailsToInsert = details.map((d) => {
          const { id: _, ruleId: __, ...rest } = d;
          return {
            ...rest,
            ruleId: rule.id,
          };
        });
        await tx.insert(schema.accountingRuleDetails).values(detailsToInsert);
      }
      return rule;
    });

    // Return complete object
    return this.findOne(rule?.id);
  }

  async findAll(companyId: number): Promise<AccountingRule[]> {
    const rules = await this.drizzle
      .select()
      .from(schema.accountingRules)
      .where(eq(schema.accountingRules.companyId, companyId));

    // For listing, we might not fetch details for performance,
    // or fetch them if needed. Usually list fetches just rules.
    // If details are needed for list view, a more complex query or loop is needed.
    // For now, I'll return rules, and let `findOne` get details.
    // However, if the user wants full object, I'll map it.
    // Let's attach details for completeness as rules are usually few.

    const results: AccountingRule[] = [];

    for (const r of rules) {
      const details = await this.drizzle
        .select()
        .from(schema.accountingRuleDetails)
        .where(eq(schema.accountingRuleDetails.ruleId, r.id));
      results.push({
        ...r,
        details: details as any, // Casting due to potential type mismatch in Drizzle inference vs DTO
      });
    }

    return results;
  }

  async findOne(id: number): Promise<AccountingRule> {
    const [rule] = await this.drizzle
      .select()
      .from(schema.accountingRules)
      .where(eq(schema.accountingRules.id, id));

    if (!rule) {
      throw new NotFoundException(`Accounting Rule with ID ${id} not found`);
    }

    const details = await this.drizzle
      .select()
      .from(schema.accountingRuleDetails)
      .where(eq(schema.accountingRuleDetails.ruleId, id));

    return {
      ...rule,
      details: details as any,
    };
  }

  async update(
    id: number,
    dto: UpdateAccountingRuleDto,
  ): Promise<AccountingRule> {
    return this.drizzle.transaction(async (tx) => {
      const { details, ...ruleUpdates } = dto;

      const [existing] = await tx
        .select()
        .from(schema.accountingRules)
        .where(eq(schema.accountingRules.id, id));

      if (!existing) {
        throw new NotFoundException(`Accounting Rule with ID ${id} not found`);
      }

      // Update Rule Fields
      if (Object.keys(ruleUpdates).length > 0) {
        await tx
          .update(schema.accountingRules)
          .set(ruleUpdates)
          .where(eq(schema.accountingRules.id, id));
      }

      // Update Details (Replace Strategy: Delete all and re-create)
      if (details) {
        await tx
          .delete(schema.accountingRuleDetails)
          .where(eq(schema.accountingRuleDetails.ruleId, id));

        if (details.length > 0) {
          const detailsToInsert = details.map((d) => {
            const { id: _, ruleId: __, ...rest } = d;
            return {
              ...rest,
              ruleId: id,
              movementType: rest.movementType as 'DEBIT' | 'CREDIT',
            };
          });
          await tx.insert(schema.accountingRuleDetails).values(detailsToInsert);
        }
      }

      return this.findOne(id);
    });
  }

  async remove(id: number): Promise<void> {
    // Constraints typically handle cascading, but explicitly:
    // Details cascade from Rule usually if configured in schema or DB.
    // Schema says: .references(() => accountingRules.id) but no onDelete action specified in the provided schema snippet on the rule side explicitly?
    // Actually looking at line 306: .references(() => accountingRules.id) - default is NO ACTION or similar unless specified.
    // Wait, checking the schema again... line 306: `ruleId: integer('rule_id').references(() => accountingRules.id)`
    // It does NOT say `onDelete: 'cascade'`. So I MUST delete details first manually to be safe.

    await this.drizzle.transaction(async (tx) => {
      await tx
        .delete(schema.accountingRuleDetails)
        .where(eq(schema.accountingRuleDetails.ruleId, id));
      await tx
        .delete(schema.accountingRules)
        .where(eq(schema.accountingRules.id, id));
    });
  }
}

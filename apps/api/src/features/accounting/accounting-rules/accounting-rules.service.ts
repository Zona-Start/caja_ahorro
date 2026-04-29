import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import { AccountingRuleWithDetails } from '@/database/types/accounting';
import { AuditHelper } from '@/features/audit/audit-event.service';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateAccountingRuleDto } from './dto/create-accounting-rule.dto';
import { UpdateAccountingRuleDto } from './dto/update-accounting-rule.dto';

@Injectable()
export class AccountingRulesService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private drizzle: NodePgDatabase<typeof schema>,
    private readonly auditHelper: AuditHelper,
  ) {}

  async create(
    tenantId: string,
    userId: string,
    dto: CreateAccountingRuleDto,
  ): Promise<AccountingRuleWithDetails> {
    const rule = await this.drizzle.transaction(async (tx) => {
      const { details, ...ruleData } = dto;

      const [rule] = await tx
        .insert(schema.accountingRules)
        .values({
          ...ruleData,
          tenantId,
          createdById: userId,
        })
        .returning();

      if (details.length > 0) {
        const detailsToInsert = details.map((d) => ({
          ...d,
          ruleId: rule.id,
          movementType: d.movementType as 'DEBIT' | 'CREDIT',
        }));
        await tx.insert(schema.accountingRuleDetails).values(detailsToInsert);
      }
      return rule;
    });

    // Registra el log auditoria
    await this.auditHelper.logCreate(tenantId, 'accountingRule', rule, {
      targetId: rule.id,
      description: `Created Accounting Rule ${rule.description}`,
    });

    return this.findOne(tenantId, String(rule.id));
  }

  async findAll(tenantId: string): Promise<AccountingRuleWithDetails[]> {
    const rules = await this.drizzle
      .select()
      .from(schema.accountingRules)
      .where(eq(schema.accountingRules.tenantId, tenantId));

    const results: AccountingRuleWithDetails[] = [];
    for (const r of rules) {
      const details = await this.drizzle
        .select()
        .from(schema.accountingRuleDetails)
        .where(eq(schema.accountingRuleDetails.ruleId, r.id));
      results.push({
        ...r,
        details: details as any,
      });
    }
    return results;
  }

  async findOne(
    tenantId: string,
    id: string,
  ): Promise<AccountingRuleWithDetails> {
    const [rule] = await this.drizzle
      .select()
      .from(schema.accountingRules)
      .where(
        and(
          eq(schema.accountingRules.id, id),
          eq(schema.accountingRules.tenantId, tenantId),
        ),
      );

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
    id: string,
    tenantId: string,
    userId: string,
    dto: UpdateAccountingRuleDto,
  ): Promise<AccountingRuleWithDetails> {
    return this.drizzle.transaction(async (tx) => {
      const { details, ...ruleUpdates } = dto;

      const [existing] = await tx
        .select()
        .from(schema.accountingRules)
        .where(
          and(
            eq(schema.accountingRules.id, id),
            eq(schema.accountingRules.tenantId, tenantId),
          ),
        );

      if (!existing) {
        throw new NotFoundException(`Accounting Rule with ID ${id} not found`);
      }

      if (Object.keys(ruleUpdates).length > 0) {
        await tx
          .update(schema.accountingRules)
          .set({
            ...ruleUpdates,
            updatedAt: new Date(),
            updatedById: userId,
          })
          .where(
            and(
              eq(schema.accountingRules.id, id),
              eq(schema.accountingRules.tenantId, tenantId),
            ),
          );
      }

      if (details) {
        await tx
          .delete(schema.accountingRuleDetails)
          .where(eq(schema.accountingRuleDetails.ruleId, id));

        if (details.length > 0) {
          const detailsToInsert = details.map((d: any) => ({
            ...d,
            ruleId: id,
            movementType: d.movementType as 'DEBIT' | 'CREDIT',
          }));
          await tx.insert(schema.accountingRuleDetails).values(detailsToInsert);
        }
      }

      // Registra el log auditoria
      await this.auditHelper.logUpdate(
        tenantId,
        'accountingRule',
        ruleUpdates,
        {
          targetId: id,
          description: `Updated Accounting Rule ${ruleUpdates.description}`,
        },
      );

      return this.findOne(tenantId, id);
    });
  }

  async remove(id: string, tenantId: string, userId: string): Promise<void> {
    await this.drizzle.transaction(async (tx) => {
      await tx
        .delete(schema.accountingRuleDetails)
        .where(eq(schema.accountingRuleDetails.ruleId, id));
      await tx
        .delete(schema.accountingRules)
        .where(
          and(
            eq(schema.accountingRules.id, id),
            eq(schema.accountingRules.tenantId, tenantId),
          ),
        );
    });
  }
}

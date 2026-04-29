import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const BalanceSchema = z.object({
  accountPlanId: z.string().uuid(),
  amount: z.coerce.number().min(0),
});

export const GenerateOpeningSchema = z.object({
  accountingCycleId: z.string().uuid(),
  entryDate: z.coerce.date(),
  balances: z.array(BalanceSchema).min(1, 'Debe incluir al menos un balance'),
});

export class GenerateOpeningDto extends createZodDto(GenerateOpeningSchema) {}

export const CloseMonthSchema = z.object({
  accountingCycleId: z.string().uuid(),
  entryDate: z.coerce.date(),
  resultAccountId: z.string().uuid(), // Cuenta de resultados (ej. Utilidades Retenidas)
});

export class CloseMonthDto extends createZodDto(CloseMonthSchema) {}

const DepreciationLineSchema = z.object({
  assetAccountId: z.string().uuid(),
  expenseAccountId: z.string().uuid(),
  amount: z.coerce.number().positive(),
});

export const DepreciationSchema = z.object({
  accountingCycleId: z.string().uuid(),
  entryDate: z.coerce.date(),
  lines: z.array(DepreciationLineSchema).min(1),
});

export class DepreciationDto extends createZodDto(DepreciationSchema) {}

const ReconciliationItemSchema = z.object({
  accountId: z.string().uuid(),
  amount: z.coerce.number(),
  description: z.string().optional(),
});

export const BankReconciliationSchema = z.object({
  accountingCycleId: z.string().uuid(),
  entryDate: z.coerce.date(),
  items: z.array(ReconciliationItemSchema).min(1),
});

export class BankReconciliationDto extends createZodDto(
  BankReconciliationSchema,
) {}

const InventoryItemSchema = z.object({
  inventoryAccountId: z.string().uuid(),
  expenseAccountId: z.string().uuid(),
  qty: z.coerce.number(),
  unitCost: z.coerce.number().min(0),
});

export const InventoryAdjustSchema = z.object({
  accountingCycleId: z.string().uuid(),
  entryDate: z.coerce.date(),
  items: z.array(InventoryItemSchema).min(1),
});

export class InventoryAdjustDto extends createZodDto(InventoryAdjustSchema) {}

const TaxItemSchema = z.object({
  expenseAccountId: z.string().uuid(),
  taxPayableAccountId: z.string().uuid(),
  amount: z.coerce.number().positive(),
});

export const TaxProvisionSchema = z.object({
  accountingCycleId: z.string().uuid(),
  entryDate: z.coerce.date(),
  items: z.array(TaxItemSchema).min(1),
});

export class TaxProvisionDto extends createZodDto(TaxProvisionSchema) {}

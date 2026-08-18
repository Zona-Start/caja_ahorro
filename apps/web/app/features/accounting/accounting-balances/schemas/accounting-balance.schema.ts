import { z } from 'zod';

export const accountingBalanceSchema = z.object({
  id: z.string().optional(),
  companyId: z.string().optional(),
  accountingCycleId: z.string().optional(),
  accountPlanId: z.string().optional(),
  initialBalance: z.string(),
  debitBalance: z.string(),
  creditBalance: z.string(),
  finalBalance: z.string(),
  accountCode: z.string().optional(),
  accountName: z.string().optional(),
  accountNature: z.enum(['DEBIT', 'CREDIT']).optional(),
});

export const balanceItemSchema = z.object({
  accountCode: z.string().min(1, 'El código de cuenta es requerido'),
  descripcion: z.string().min(1, 'La descripción es requerida'),
  auxiliarSocio: z.string().optional().nullable(),
  auxiliarProveedor: z.string().optional().nullable(),
  balance: z.number(),
});

export const initialLoadSchema = z.object({
  balances: z
    .array(balanceItemSchema)
    .min(1, 'Debe proporcionar al menos un balance'),
});

export const closeCycleSchema = z.object({
  isFiscalYearEnd: z.boolean().default(false),
});

export const openCycleSchema = z.object({
  targetCycleId: z.string().min(1, 'El ID del ciclo a abrir es requerido'),
});

export type AccountingBalance = z.infer<typeof accountingBalanceSchema>;
export type BalanceItem = z.infer<typeof balanceItemSchema>;
export type InitialLoad = z.infer<typeof initialLoadSchema>;
export type CloseCycle = z.infer<typeof closeCycleSchema>;
export type OpenCycle = z.infer<typeof openCycleSchema>;

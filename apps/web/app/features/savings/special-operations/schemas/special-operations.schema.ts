import { z } from 'zod';

export const specialOperationTypeSchema = z.enum([
  'LIQUIDATION_VS_INCOME',
  'LOAN_WITHDRAWAL_VS_SAVINGS',
]);

export type SpecialOperationType = z.infer<
  typeof specialOperationTypeSchema
>;

export const specialOperationMovementTypeSchema = z.enum([
  'DEBIT',
  'CREDIT',
]);

export type SpecialOperationMovementType = z.infer<
  typeof specialOperationMovementTypeSchema
>;

export const specialOperationAccountConfigItemSchema = z.object({
  role: z.string(),
  label: z.string().optional(),
  accountPlanId: z.string().uuid(),
  movementType: specialOperationMovementTypeSchema,
  isAuxiliary: z.boolean(),
});

export type SpecialOperationAccountConfigItem = z.infer<
  typeof specialOperationAccountConfigItemSchema
>;

export const previewRowSchema = z.object({
  rowNumber: z.number(),
  cedula: z.string(),
  associateId: z.string().nullable(),
  associateAccountId: z.string().nullable(),
  fullname: z.string(),
  date: z.string().optional(),
  status: z.enum(['OK', 'ERROR']),
  error: z.string().optional(),
  amounts: z.record(z.number()),
  display: z.record(z.number()),
  breakdown: z.object({
    withdrawals: z.array(
      z.object({
        type: z.string(),
        amount: z.number(),
        isSpecial: z.boolean(),
      }),
    ),
    loans: z.array(
      z.object({
        type: z.string(),
        amount: z.number(),
      }),
    ),
    credits: z.array(
      z.object({
        type: z.string(),
        amount: z.number(),
      }),
    ),
  }),
});

export type PreviewRow = z.infer<typeof previewRowSchema>;

export const specialOperationRoleSchema = z.object({
  role: z.string(),
  label: z.string(),
  total: z.number(),
  defaultMovementType: specialOperationMovementTypeSchema,
  required: z.boolean(),
  defaultIsAuxiliary: z.boolean().optional(),
});

export type SpecialOperationRole = z.infer<
  typeof specialOperationRoleSchema
>;

export const previewResponseSchema = z.object({
  operationType: specialOperationTypeSchema,
  operationDate: z.string(),
  rows: z.array(previewRowSchema),
  totals: z.record(z.number()),
  roles: z.array(specialOperationRoleSchema),
  summary: z.object({
    totalRows: z.number(),
    validRows: z.number(),
    errorRows: z.number(),
  }),
});

export type PreviewResponse = z.infer<typeof previewResponseSchema>;

export type ExecuteSpecialOperationPayload = {
  operationType: SpecialOperationType;
  operationDate: string;
  rows: Array<{ cedula: string; date?: string }>;
  accountConfig: SpecialOperationAccountConfigItem[];
  notes?: string;
};

export type ExecuteSpecialOperationResponse = {
  message: string;
  operationId: string;
  reference: string;
  totalAssociates: number;
  totalAmount: number;
  accountingEntryId: string;
  voucherNo: number;
};

export type SpecialOperationListItem = {
  id: string;
  reference: string;
  operationType: SpecialOperationType;
  operationDate: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  totalAssociates: number;
  totalAmount: string;
  currencyCode: string;
  accountingEntryId: string | null;
  voucherNo?: number | null;
  notes: string | null;
  createdAt: string;
};

export const OPERATION_LABELS: Record<SpecialOperationType, string> = {
  LIQUIDATION_VS_INCOME: 'Liquidación vs Ingresos',
  LOAN_WITHDRAWAL_VS_SAVINGS: 'Retiros Préstamos vs Haberes',
};

export const OPERATION_DESCRIPTIONS: Record<SpecialOperationType, string> = {
  LIQUIDATION_VS_INCOME:
    'Liquida los haberes del asociado, cancela préstamos y créditos, lo retira y aplica el neto a una cuenta de ingreso.',
  LOAN_WITHDRAWAL_VS_SAVINGS:
    'Aplica un retiro por el capital exacto de los préstamos para dejarlos en cero, sin generar excedentes.',
};

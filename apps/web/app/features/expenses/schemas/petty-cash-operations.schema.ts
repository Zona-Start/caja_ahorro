import { z } from 'zod';

export const voucherFormSchema = z.object({
  fundId: z.string().uuid('El fondo fijo es requerido'),
  beneficiaryName: z
    .string()
    .min(1, 'El beneficiario es requerido')
    .max(255, 'Máximo 255 caracteres'),
  amount: z.coerce.number().positive('El monto debe ser mayor a cero'),
  concept: z.string().min(1, 'El concepto es requerido'),
  ticketImageUrl: z
    .string()
    .url('Debe ser una URL válida')
    .optional()
    .or(z.literal('')),
});

export type VoucherForm = z.infer<typeof voucherFormSchema>;

export const voucherSchema = voucherFormSchema.extend({
  id: z.string().uuid(),
  voucherNumber: z.string(),
  status: z.enum(['OPEN', 'LIQUIDATED', 'SETTLED']),
  fundName: z.string().optional(),
  currencyCode: z.enum(['VES', 'USD', 'EUR']).optional(),
  expenseId: z.string().uuid().nullable().optional(),
  voucherDate: z.string().optional(),
  liquidatedAt: z.string().nullable().optional(),
});

export type Voucher = z.infer<typeof voucherSchema>;

export const liquidateVoucherSchema = z.object({
  categoryId: z.string().uuid('La categoría de gasto es requerida'),
  description: z.string().max(255).optional(),
  receiptNumber: z
    .string()
    .max(100, 'Máximo 100 caracteres')
    .optional()
    .or(z.literal('')),
});

export type LiquidateVoucherForm = z.infer<typeof liquidateVoucherSchema>;

export const settlementSchema = z.object({
  id: z.string().uuid(),
  fundId: z.string().uuid(),
  fundName: z.string().optional(),
  currencyCode: z.enum(['VES', 'USD', 'EUR']).optional(),
  period: z.string(),
  openingBalance: z.number(),
  vouchersTotal: z.number(),
  expensesTotal: z.number(),
  replenishmentsTotal: z.number(),
  physicalCount: z.number().nullable().optional(),
  difference: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(['OPEN', 'CLOSED']),
  replenishmentStatus: z.enum(['NONE', 'PENDING', 'PAID']).optional(),
  replenishmentAmount: z.number().optional(),
  replenishmentRequestedAt: z.string().nullable().optional(),
  replenishmentPaidAt: z.string().nullable().optional(),
  closedAt: z.string().nullable().optional(),
});

export type Settlement = z.infer<typeof settlementSchema>;

export const openSettlementSchema = z.object({
  fundId: z.string().uuid('El fondo fijo es requerido'),
  period: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Formato YYYY-MM')
    .optional(),
});

export type OpenSettlementForm = z.infer<typeof openSettlementSchema>;

export const closeSettlementSchema = z.object({
  physicalCount: z.coerce
    .number()
    .min(0, 'El conteo físico no puede ser negativo'),
  replenishmentsTotal: z.coerce.number().min(0).optional().default(0),
  notes: z.string().max(500).optional(),
});

export type CloseSettlementForm = z.infer<typeof closeSettlementSchema>;

export const realizeSettlementSchema = z.object({
  fundId: z.string().uuid('El fondo fijo es requerido'),
  period: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'El período debe tener formato YYYY-MM')
    .optional(),
  physicalCount: z.coerce
    .number()
    .min(0, 'El conteo físico no puede ser negativo'),
  replenishmentsTotal: z.coerce.number().min(0).optional().default(0),
  notes: z.string().max(500).optional(),
});

export type RealizeSettlementForm = z.infer<typeof realizeSettlementSchema>;

export interface SettlementPreview {
  fundId: string;
  fundName: string;
  currencyCode: 'VES' | 'USD' | 'EUR';
  period: string;
  openingBalance: number;
  expensesTotal: number;
  vouchersTotal: number;
  replenishmentsTotal: number;
  expected: number;
}

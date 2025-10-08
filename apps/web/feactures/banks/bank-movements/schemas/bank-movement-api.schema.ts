import { z } from 'zod';
import {
  categoryKeys,
  internalLinkStatusKeys,
  paymentMethodKeys,
  reconciliationStatusKeys,
} from './bank-movement-options';

// Esquema para un solo movimiento bancario, como se recibe de la API
export const apiBankMovementSchema = z.object({
  id: z.number(),
  bankAccountId: z.number(),
  paymentMethod: z.enum(paymentMethodKeys),
  transactionDate: z.string(), // Las fechas vienen como strings
  valueDate: z.string().nullable(),
  description: z.string(),
  category: z.enum(categoryKeys),
  bankReference: z.string().nullable(),
  debitAmount: z.string().nullable(), // Los montos vienen como strings
  creditAmount: z.string().nullable(),
  resultingBalance: z.string().nullable(),
  reconciliationStatus: z.enum(reconciliationStatusKeys),
  bankReconciliationId: z.number().nullable(),
  uploadBatchId: z.string().nullable(),
  uploadedAt: z.string(),
  internalLinkStatus: z.enum(internalLinkStatusKeys),
  note: z.string().nullable(),
  createdAt: z.string(),
  createdById: z.number().nullable(),
  updatedAt: z.string().nullable(),
  updatedById: z.number().nullable(),
});

// Esquema para la respuesta de un solo movimiento
export const bankMovementResponseSchema = z.object({
  message: z.string(),
  data: apiBankMovementSchema,
});

// Esquema para la respuesta paginada de movimientos
export const paginatedBankMovementsResponseSchema = z.object({
  message: z.string(),
  data: z.array(apiBankMovementSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
    nextPage: z.number().nullable(),
    previousPage: z.number().nullable(),
  }),
});

// Esquema para un item vinculable
export const linkableItemApiSchema = z.object({
  id: z.number(),
  type: z.string(),
  amount: z.string(),
  date: z.string().nullable(),
  concept: z.string(),
});

// Esquema para la respuesta de la API de items vinculables
export const linkablesResponseSchema = z.object({
  message: z.string(),
  data: z.array(linkableItemApiSchema),
});

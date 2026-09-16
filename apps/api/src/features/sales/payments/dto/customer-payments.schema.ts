import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateCustomerPaymentSchema = z.object({
  tenantId: z.string().uuid().optional(),
  customerId: z.string().uuid('El cliente es requerido'),
  invoiceId: z.string().uuid('La factura es requerida'),
  amount: z.coerce.number().positive('El monto debe ser mayor a cero'),
  paymentMethod: z
    .enum(['CASH', 'CARD', 'TRANSFER', 'OTHER'])
    .default('CASH'),
  cashRegisterSessionId: z.string().uuid().optional(),
  referenceNumber: z.string().max(100).optional(),
  paymentDate: z.string().optional(),
  notes: z.string().max(500).optional(),
});
export class CreateCustomerPaymentDto extends createZodDto(
  CreateCustomerPaymentSchema,
) {}

export const FilterCustomerPaymentSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  customerId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
export class FilterCustomerPaymentDto extends createZodDto(
  FilterCustomerPaymentSchema,
) {}

export const FilterReceivableSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  search: z.string().optional(),
  customerId: z.string().uuid().optional(),
});
export class FilterReceivableDto extends createZodDto(
  FilterReceivableSchema,
) {}

/** Internal (non-validated) payment input used for cash sales. */
export interface CreateCustomerPaymentInput {
  customerId: string;
  invoiceId: string;
  amount: number;
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'OTHER';
  cashRegisterSessionId?: string;
  referenceNumber?: string;
  paymentDate?: string;
  notes?: string;
}

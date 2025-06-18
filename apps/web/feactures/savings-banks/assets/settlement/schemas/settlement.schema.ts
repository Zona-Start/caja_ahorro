// src/schemas/settlement.schema.ts
import { z } from 'zod';
import { paymentMethodEnum } from './settlement-options'; // Ensure this path is correct

export const beneficiarySchema = z.object({
  fullname: z.string().min(3, 'El nombre completo es requerido'), // Add min length for better validation
  cedula: z.string().min(6, 'La cédula es requerida'), // Add min length
  phone: z.string().optional(), // Optional as per your current schema
  accountNumber: z.string().min(20, 'El número de cuenta es requerido'), // Add min length
  bankDirectoryId: z
    .number()
    .int()
    .positive('Debe seleccionar un banco válido'), // Ensure it's a positive integer
});

// Esquema de validación para el registro la liquidacion
export const settlementSchema = z
  .object({
    id: z.number().optional(),
    associateId: z.number(),
    netLiquidationAmount: z.number(),
    totalOutstandingCreditsAtLiquidation: z.number(),
    totalOutstandingLoansAtLiquidation: z.number(),
    totalSavingsBalanceAtLiquidation: z.number(),
    liquidationDate: z.date(), // Zod's .date() expects a Date object, not ISO string
    notes: z.string().optional(), // Make notes optional if it's not always required
    paymentMethod: paymentMethodEnum, // Ensure this enum is properly defined

    // Nuevo campo para controlar si hay beneficiario
    hasBeneficiary: z.boolean(),

    // Haz beneficiary opcional al principio, y luego aplica una validación condicional
    beneficiary: z.array(beneficiarySchema).optional(),
  })
  .superRefine((data, ctx) => {
    // Validación condicional para 'beneficiary'
    if (
      data.hasBeneficiary &&
      (!data.beneficiary || data.beneficiary.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Debe especificar al menos un beneficiario si la opción está seleccionada.',
        path: ['beneficiary'], // Esto dirigirá el error al campo 'beneficiary'
      });
    }
  });

export type Settlement = z.infer<typeof settlementSchema>;


import { z } from 'zod';

// Esquema para los detalles del asociado (GET /associates/details/:cedula)
export const associateDetailsSchema = z.object({
  cedula: z.string(),
  fullname: z.string(),
  nationality: z.string(),
  gender: z.string(),
  admissionDate: z.string(),
  graduationDate: z.string().nullable(),
  status: z.string(),
  isPayrollCredit: z.boolean(),
  baseSalary: z.string().nullable(),
  locality: z.string().nullable(),
  accountNumber: z.string().nullable(),
  bankName: z.string().nullable(),
  totalHaberes: z.string(),
  paymentCapacity: z.string(),
  id: z.number(),
});

export const associateDetailsResponseSchema = z.object({
  message: z.string(),
  data: associateDetailsSchema,
});

// Esquema para los movimientos de haberes (GET /haberes/by-associate/:associateId)
export const haberesMovementSchema = z.object({
  fecha: z.string(),
  concepto: z.string().nullable(),
  tipo: z.string(),
  monto: z.string(),
});

export const haberesMovementsResponseSchema = z.object({
  message: z.string(),
  data: z.array(haberesMovementSchema),
});

// Esquema para los retiros (GET /by-associate/:associateId)
export const withdrawalSchema = z.object({
  withdrawalDate: z.string(),
  description: z.string().nullable(),
  amount: z.string(),
  paymentMethod: z.string().nullable(),
  status: z.string(),
});

export const withdrawalsResponseSchema = z.object({
  message: z.string(),
  data: z.array(withdrawalSchema),
});

// Esquema para el historial de transacciones (GET /history/by-associate/:associateId)
export const transactionHistorySchema = z.object({
  tipo: z.string(),
  monto: z.string(),
  fecha: z.string(),
  descripcion: z.string().nullable(),
  numeroReferencia: z.string().nullable(),
});

export const transactionHistoryResponseSchema = z.object({
  message: z.string(),
  data: z.array(transactionHistorySchema),
});

// Esquema para los préstamos (GET /by-associate/:associateId)
export const loanSchema = z.object({
  loanType: z.string().nullable(),
  interestRate: z.string(),
  loanAmount: z.string(),
  outstandingBalance: z.string().nullable(),
  installmentAmount: z.string(),
  requestDate: z.string(),
  terms: z.number(),
  status: z.string(),
  progress: z.string(),
});

export const loansResponseSchema = z.object({
  message: z.string(),
  data: z.array(loanSchema),
});

// Esquema para los créditos (GET /by-associate/:associateId)
export const creditSchema = z.object({
  creditType: z.string().nullable(),
  interestRate: z.string(),
  creditAmount: z.string(),
  outstandingBalance: z.string().nullable(),
  installmentAmount: z.string(),
  requestDate: z.string(),
  terms: z.number(),
  status: z.string(),
  progress: z.string(),
});

export const creditsResponseSchema = z.object({
  message: z.string(),
  data: z.array(creditSchema),
});

export type AssociateDetails = z.infer<typeof associateDetailsSchema>;

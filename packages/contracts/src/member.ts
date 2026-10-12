import { z } from 'zod';

/**
 * Formas de respuesta con PARIDAD con el área `inquiry` del ERP
 * (mismos nombres de campo que consume el frontend actual).
 */

export const statementSchema = z.object({
  id: z.string().uuid(),
  cedula: z.string(),
  fullname: z.string(),
  nationality: z.string(),
  gender: z.string().nullable(),
  admissionDate: z.string(),
  graduationDate: z.string().nullable(),
  status: z.string(),
  isPayrollCredit: z.boolean(),
  baseSalary: z.string(),
  locality: z.string().nullable(),
  accountNumber: z.string().nullable(),
  bankName: z.string().nullable(),
  totalHaberes: z.string(),
  paymentCapacity: z.string(),
  disponibility: z.string(),
  haberesContribution: z.string(),
  haberesVoluntary: z.string(),
  haberesEmployer: z.string(),
  surpluses: z.string(),
});
export type Statement = z.infer<typeof statementSchema>;

export const haberSchema = z.object({
  fecha: z.string().nullable(),
  concepto: z.string().nullable(),
  tipo: z.string(),
  monto: z.string(),
});
export type Haber = z.infer<typeof haberSchema>;

export const withdrawalSchema = z.object({
  id: z.string().uuid(),
  withdrawalDate: z.string().nullable(),
  description: z.string().nullable(),
  amount: z.string().nullable(),
  disbursedAmount: z.string().nullable(),
  administrativeFee: z.string().nullable(),
  paymentMethod: z.string().nullable(),
  status: z.string(),
  referenceCode: z.string().nullable(),
});
export type Withdrawal = z.infer<typeof withdrawalSchema>;

export const loanSchema = z.object({
  id: z.string().uuid(),
  loanType: z.string().nullable(),
  interestRate: z.string().nullable(),
  loanAmount: z.string(),
  outstandingBalance: z.string().nullable(),
  installmentAmount: z.string().nullable(),
  requestDate: z.string().nullable(),
  terms: z.number().nullable(),
  status: z.string(),
  customReference: z.string().nullable(),
  progress: z.string().nullable(),
});
export type Loan = z.infer<typeof loanSchema>;

export const creditSchema = z.object({
  id: z.string().uuid(),
  creditType: z.string().nullable(),
  interestRate: z.string().nullable(),
  creditAmount: z.string(),
  outstandingBalance: z.string().nullable(),
  installmentAmount: z.string().nullable(),
  requestDate: z.string().nullable(),
  terms: z.number().nullable(),
  status: z.string(),
  customReference: z.string().nullable(),
  progress: z.string().nullable(),
});
export type Credit = z.infer<typeof creditSchema>;

export const movementSchema = z.object({
  tipo: z.string(),
  monto: z.string(),
  fecha: z.string().nullable(),
  descripcion: z.string().nullable(),
  numeroReferencia: z.string().nullable(),
  status: z.string(),
});
export type Movement = z.infer<typeof movementSchema>;

export const overchargeSummarySchema = z.object({
  SAVING_WITHDRAWAL_REVERSAL_CREDIT: z.number().int(),
  LOAN_PAYMENT_REVERSAL_CREDIT: z.number().int(),
  CREDIT_PAYMENT_REVERSAL_CREDIT: z.number().int(),
});
export type OverchargeSummary = z.infer<typeof overchargeSummarySchema>;

export const movementTypeSchema = z.enum([
  'SAVING_WITHDRAWAL_REVERSAL_CREDIT',
  'LOAN_PAYMENT_REVERSAL_CREDIT',
  'CREDIT_PAYMENT_REVERSAL_CREDIT',
]);
export type MovementType = z.infer<typeof movementTypeSchema>;

/** Detalles: estructura amplia (el frontend consume el JSON completo). */
export const loanDetailSchema = z.object({}).passthrough();
export const creditDetailSchema = z.object({}).passthrough();
export const withdrawalDetailSchema = z.object({}).passthrough();
export type LoanDetail = z.infer<typeof loanDetailSchema>;
export type CreditDetail = z.infer<typeof creditDetailSchema>;
export type WithdrawalDetail = z.infer<typeof withdrawalDetailSchema>;

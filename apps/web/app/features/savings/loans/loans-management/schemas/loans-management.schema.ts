import { z } from 'zod';

export const loanManagementSchema = z.object({
  id: z.string().optional(),
  associateId: z.number(),
  creditTypeId: z.string({
    required_error: 'Por favor seleccione el tipo de préstamo',
  }),
  creditModality: z.string({
    required_error: 'Por favor seleccione la modalidad',
  }),
  requestDate: z.date({
    required_error: 'Por favor seleccione la fecha de solicitud',
  }),
  requestedAmount: z.string().min(1, {
    message: 'Por favor ingrese el monto del préstamo',
  }),
  startDate: z.date({
    required_error: 'Por favor seleccione la fecha de inicio',
  }),
  endDate: z.string().optional(),
  expensesAmount: z.string().optional(),
  overdraftAmount: z.string().optional().nullable(),
  paymentMethod: z.string({
    required_error: 'Por favor seleccione el método de pago',
  }),
  disbursementAccountId: z.string({
    required_error: 'Por favor seleccione la cuenta de desembolso',
  }),
  status: z.string().optional(),
  notes: z.string().optional(),
  termUnits: z.string().min(1, {
    message: 'La cantidad de plazos es requerida',
  }),
  interestRate: z.string().min(1, {
    message: 'La tasa de interés es requerida',
  }),
  termType: z.string({
    required_error: 'Por favor seleccione el tipo de plazo',
  }),

  loanTypeName: z.string().optional(),
  loanModality: z.string().optional(),
  associateCedula: z.string().optional(),
  associateFullname: z.string().optional(),
  customReference: z.string().optional(),
  disbursedAmount: z.string().optional(),
  totalInterest: z.string().optional(),
  totalPayable: z.string().optional(),
  approvalDate: z.string().optional(),
  loanTypeId: z.string().optional(),
  loanTypeInterestRate: z.string().optional(),
  invoiceNumber: z.string().optional(),
  associatePhone: z.string().optional(),
  associateEmail: z.string().optional(),
  associateDateAdmission: z.string().optional(),
  associateIsPayrollCredit: z.boolean().optional().nullable(),
  associateAccountId: z.number().optional().nullable(),
  associateAccountNumber: z.string().optional(),
  associateBalance: z.string().optional(),
});

export type LoanManagement = z.infer<typeof loanManagementSchema>;

import { z } from 'zod';

export const loanManagementSchema = z.object({
  id: z.string().optional(),
  associateId: z.string({
    required_error: 'Por favor seleccione un asociado',
  }),
  loanTypeId: z.string({
    required_error: 'Por favor seleccione el tipo de préstamo',
  }),
  loanModality: z.string({
    required_error: 'Por favor seleccione la modalidad',
  }),
  requestDate: z.date({
    required_error: 'Por favor seleccione la fecha de solicitud',
  }),
  requestedAmount: z.preprocess(
    (v) => (typeof v === 'string' ? parseFloat(v) || 0 : v),
    z.number().min(1, { message: 'Por favor ingrese el monto del préstamo' }),
  ),
  interestRate: z.preprocess(
    (v) => (typeof v === 'string' ? parseFloat(v) || 0 : v),
    z.number().min(0, { message: 'La tasa de interés es requerida' }),
  ),
  startDate: z.date({
    required_error: 'Por favor seleccione la fecha de inicio',
  }),
  endDate: z.string().optional(),
  paymentMethod: z.string().optional(),
  expensesPercentage: z.preprocess(
    (v) => (typeof v === 'string' ? parseFloat(v) || 0 : v),
    z.number().min(0).max(100).optional(),
  ),
  termType: z.string().default('installments'),
  termUnits: z.preprocess(
    (v) => (typeof v === 'string' ? parseInt(v, 10) || 1 : v),
    z.number().int().min(1, { message: 'La cantidad de plazos es requerida' }),
  ),
  status: z.string().optional(),
  notes: z.string().optional().nullable(),
  loanTypeName: z.string().optional(),
  customReference: z.string().optional(),
  associateCedula: z.string().optional(),
  associateFullname: z.string().optional(),
  disbursedAmount: z.string().optional(),
  totalInterest: z.string().optional(),
  totalPayable: z.string().optional(),
  expensesAmount: z.string().optional(),
  approvalDate: z.string().optional(),
  loanTypeInterestRate: z.string().optional(),
  associateAccountNumber: z.string().optional(),
  disbursedAmount: z.string().optional(),
  accountNumber: z.string().optional(),
  approvedAmount: z.string().optional(),
  currencyCode: z.string().optional(),
});

export type LoanManagement = z.infer<typeof loanManagementSchema>;

export const loanDefaults: LoanManagement = {
  associateId: '',
  loanTypeId: '',
  loanModality: 'ORDINARY',
  requestDate: new Date(),
  requestedAmount: 0,
  interestRate: 0,
  startDate: new Date(),
  termType: 'installments',
  termUnits: 1,
};

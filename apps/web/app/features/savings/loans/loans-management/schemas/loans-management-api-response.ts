import { z } from 'zod';

export const SearchAssociateResultSchema = z.object({
  associate: z.object({
    id: z.string(),
    cedula: z.string(),
    fullname: z.string(),
    baseSalary: z.string().nullable(),
    isPayrollCredit: z.boolean(),
    phone: z.string().nullable(),
    email: z.string().nullable(),
    dateAdmission: z.string().nullable(),
    status: z.string(),
  }),
  account: z
    .object({
      id: z.string(),
      accountNumber: z.string(),
    })
    .nullable(),
  balance: z.number(),
  available80: z.number(),
  hasActiveLoan: z.boolean(),
  hasActiveCredit: z.boolean(),
  hasPayrollCredit: z.boolean(),
  baseSalary: z.number(),
  paymentCapacity: z.number(),
});

export type SearchAssociateResult = z.infer<typeof SearchAssociateResultSchema>;

export const LoanManagementMutationResponse = z.object({
  id: z.string(),
  customReference: z.string().nullable(),
});

export const LoanTypeResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  interestRate: z.string(),
  termType: z.string(),
  termUnits: z.number(),
  administrativeExpensePercentage: z.string().nullable(),
  minLoanAmount: z.string().nullable(),
  maxLoanAmount: z.string().nullable(),
});

export type LoanTypeResponse = z.infer<typeof LoanTypeResponseSchema>;

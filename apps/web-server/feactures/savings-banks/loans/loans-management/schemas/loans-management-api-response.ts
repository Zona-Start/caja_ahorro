import { z } from 'zod';

export const LoanManagementMutationResponse = z.object({
  id: z.number(),
  customReference: z.string().nullable(),
});

export const LoanManagementGetResponseSchema = z.object({
  id: z.number(),
  associateId: z.number(),
  associateCedula: z.string(),
  associateFullname: z.string(),
  loanTypeId: z.number(),
  loanModality: z.string(),
  loanTypeName: z.string(),
  requestDate: z.string(),
  approvalDate: z.string().nullable(),
  disbursementDate: z.string().nullable(),
  requestedAmount: z.string(),
  approvedAmount: z.string().nullable(),
  disbursedAmount: z.string().nullable(),
  startDate: z.string(),
  endDate: z.string(),
  totalInterest: z.string().nullable(),
  totalPayable: z.string().nullable(),
  expensesAmount: z.string().nullable(),
  overdraftAmount: z.string().nullable(),
  previousLoanId: z.number().nullable(),
  paymentMethod: z.string(),
  disbursementAccountId: z.number(),
  status: z.string(),
  rejectionReason: z.string().nullable(),
  approvedByUserId: z.number().nullable(),
  disbursedByUserId: z.number().nullable(),
  notes: z.string().nullable(),
  customReference: z.string().nullable(),
  currencyCode: z.string(),
  exchangeRateId: z.number().nullable(),
  termType: z.string().nullable(),
  termUnits: z.number().nullable(),
  interestRate: z.string().nullable(),
});

//schema response query pagination
export const LoanManagementResponseAllSchema = z.object({
  message: z.string().optional(),
  data: z.array(LoanManagementGetResponseSchema),
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

//schema response delete mutation
export const LoansDeleteResponseSchema = z.object({
  message: z.string(),
});

export type LoanAssociate = z.infer<typeof LoanManagementGetResponseSchema>;

export const LoanAssociateGetResponseSchema = z.object({
  id: z.number(),
  associateId: z.number(),
  associateCedula: z.string(),
  associateFullname: z.string(),
  associatePhone: z.string(),
  associateEmail: z.string(),
  associateDateAdmission: z.string(),
  associateIsPayrollCredit: z.boolean(),
  associateAccountId: z.number(),
  associateAccountNumber: z.string(),
  associateBalance: z.string(),
  loanTypeId: z.number(),
  loanModality: z.string(),
  loanTypeName: z.string(),
  requestDate: z.string(),
  approvalDate: z.string().nullable(),
  disbursementDate: z.string().nullable(),
  requestedAmount: z.string(),
  approvedAmount: z.string(),
  disbursedAmount: z.string().nullable(),
  startDate: z.string(),
  endDate: z.string(),
  totalInterest: z.string().nullable(),
  totalPayable: z.string(),
  expensesAmount: z.string(),
  overdraftAmount: z.string().nullable(),
  previousLoanId: z.number().nullable(),
  paymentMethod: z.string(),
  disbursementAccountId: z.number(),
  status: z.string(),
  rejectionReason: z.string().nullable(),
  approvedByUserId: z.number(),
  disbursedByUserId: z.number().nullable(),
  notes: z.string(),
  customReference: z.string().nullable(),
  currencyCode: z.string(),
  exchangeRateId: z.number().nullable(),
  totalLoans: z.number().nullable(),
});

export const loanManagementAllCountResponseSchema = z.object({
  totalLoansOrdinary: z.number(),
  totalLoanSpecialQuotas: z.number(),
  totalLoanPaid: z.number(),
  totalLoanInPaymet: z.number(),
});

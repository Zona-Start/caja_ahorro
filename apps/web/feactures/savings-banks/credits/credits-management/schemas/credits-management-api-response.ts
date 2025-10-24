import { z } from 'zod';

export const CreditManagementMutationResponse = z.object({
  id: z.number(),
  customReference: z.string().nullable(),
});

export const CreditManagementGetResponseSchema = z.object({
  id: z.number(),
  associateId: z.number(),
  associateCedula: z.string(),
  associateFullname: z.string(),
  creditTypeId: z.number(),
  creditModality: z.string(),
  creditTypeName: z.string(),
  creditTypeInterestRate: z.string().nullable(),
  creditTypeAdministrativeExpensePercentage: z.string().nullable(),
  creditTypeTermUnits: z.number().nullable(),
  requestDate: z.string(),
  approvalDate: z.string().nullable(),
  requestedAmount: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  totalInterest: z.string().nullable(),
  totalPayable: z.string().nullable(),
  expensesAmount: z.string().nullable(),
  overdraftAmount: z.string().nullable(),
  previousCreditId: z.number().nullable(),
  status: z.string(),
  approvedByUserId: z.number().nullable(),
  notes: z.string().nullable(),
  customReference: z.string().nullable(),
  currencyCode: z.string().nullable(),
  exchangeRateId: z.number().nullable(),
  invoiceNumber: z.string().nullable(),
  termType: z.string().nullable(),
  termUnits: z.number().nullable(),
  interestRate: z.string().nullable(),
});

//schema response query pagination
export const CreditManagementResponseAllSchema = z.object({
  message: z.string().optional(),
  data: z.array(CreditManagementGetResponseSchema),
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
export const CreditDeleteResponseSchema = z.object({
  message: z.string(),
});

export type CreditsAssociate = z.infer<
  typeof CreditManagementGetResponseSchema
>;

export const CreditAssociateGetResponseSchema = z.object({
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
  creditTypeId: z.number(),
  creditModality: z.string(),
  creditTypeName: z.string(),
  requestDate: z.string(),
  approvalDate: z.string().nullable(),
  requestedAmount: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  totalInterest: z.string().nullable(),
  totalPayable: z.string(),
  expensesAmount: z.string(),
  overdraftAmount: z.string().nullable(),
  previousCreditId: z.number().nullable(),
  status: z.string(),
  approvedByUserId: z.number(),
  notes: z.string(),
  customReference: z.string().nullable(),
  currencyCode: z.string(),
  exchangeRateId: z.number().nullable(),
  totalCredits: z.number().nullable(),
  invoiceNumber: z.string().nullable(),
  commercialHouseId: z.number().nullable(),
});

export const creditManagementAllCountResponseSchema = z.object({
  totalCreditOrdinary: z.number(),
  totalCreditSpecialQuotas: z.number(),
  totalCreditPaid: z.number(),
  totalCreditInPaymet: z.number(),
});

import { z } from 'zod';

export const CreditManagementGetResponseSchema = z.object({
  id: z.string(),
  associateId: z.string(),
  associateCedula: z.string().nullable(),
  associateFullname: z.string().nullable(),
  creditTypeId: z.string(),
  creditModality: z.string(),
  creditTypeName: z.string().nullable(),
  creditTypeInterestRate: z.string().nullable(),
  creditTypeAdministrativeExpensePercentage: z.string().nullable(),
  creditTypeTermUnits: z.number().nullable(),
  requestDate: z.string().nullable(),
  approvalDate: z.string().nullable(),
  requestedAmount: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  totalInterest: z.string().nullable(),
  installmentAmount: z.string().nullable(),
  totalPayable: z.string().nullable(),
  expensesAmount: z.string().nullable(),
  overdraftAmount: z.string().nullable(),
  previousCreditId: z.string().nullable(),
  status: z.string(),
  approvedByUserId: z.string().nullable(),
  notes: z.string().nullable(),
  customReference: z.string().nullable(),
  currencyCode: z.string().nullable(),
  exchangeRateId: z.string().nullable(),
  invoiceNumber: z.string().nullable(),
  termType: z.string().nullable(),
  termUnits: z.number().nullable(),
  interestRate: z.string().nullable(),
});

export const CreditManagementResponseAllSchema = z.object({
  data: z.array(CreditManagementGetResponseSchema),
  meta: z.object({
    totalItems: z.number(),
    itemCount: z.number(),
    itemsPerPage: z.number(),
    totalPages: z.number(),
    currentPage: z.number(),
  }),
});

export const CreditManagementMutationResponse = z.object({
  id: z.string(),
  customReference: z.string().nullable(),
});

export const CreditDeleteResponseSchema = z.object({
  message: z.string(),
});

export const SearchAssociateResponseSchema = z.object({
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
      balance: z.string().nullable(),
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

export const AmortizationResponseSchema = z.object({
  schedule: z.array(
    z.object({
      installmentNumber: z.number(),
      dueDate: z.string(),
      principalAmount: z.string(),
      interestAmount: z.string(),
      totalInstallmentAmount: z.string(),
      principalBalancePending: z.string(),
    }),
  ),
  monthlyPayment: z.string(),
});

export const CreditCountResponseSchema = z.object({
  totalCreditOrdinary: z.number(),
  totalCreditSpecialQuotas: z.number(),
  totalCreditPaid: z.number(),
  totalCreditInPayment: z.number(),
});

export const CreditTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  interestRate: z.string(),
  termType: z.string(),
  termUnits: z.number(),
  administrativeExpensePercentage: z.string().nullable(),
  minCreditAmount: z.string().nullable(),
  maxCreditAmount: z.string().nullable(),
});

export const BankAccountSchema = z.object({
  id: z.string(),
  accountNumber: z.string(),
  accountName: z.string().nullable(),
  bankDirectoryId: z.string().nullable(),
  currencyCode: z.string(),
  isActive: z.boolean().nullable(),
});

export type CreditsAssociate = z.infer<typeof CreditManagementGetResponseSchema>;
export type SearchAssociateResult = z.infer<typeof SearchAssociateResponseSchema>;
export type AmortizationResult = z.infer<typeof AmortizationResponseSchema>;
export type CreditTypeResult = z.infer<typeof CreditTypeSchema>;
export type BankAccountResult = z.infer<typeof BankAccountSchema>;

import { z } from 'zod';

export const metaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  totalCount: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

export const associateStatementSchema = z.object({
  id: z.string(),
  cedula: z.string(),
  fullname: z.string(),
  nationality: z.string(),
  gender: z.string().nullable(),
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
  disponibility: z.string(),
  haberesContribution: z.string(),
  haberesVoluntary: z.string(),
  haberesEmployer: z.string(),
  surpluses: z.string(),
});

export const statementResponseSchema = z.object({
  message: z.string(),
  data: associateStatementSchema,
});

export const haberesMovementSchema = z.object({
  fecha: z.string().nullable(),
  concepto: z.string().nullable(),
  tipo: z.string(),
  monto: z.string(),
});

export const haberesPaginatedResponseSchema = z.object({
  message: z.string(),
  data: z.array(haberesMovementSchema),
  meta: metaSchema,
});

export const withdrawalListItemSchema = z.object({
  id: z.string(),
  withdrawalDate: z.string().nullable(),
  description: z.string().nullable(),
  amount: z.string(),
  disbursedAmount: z.string().nullable(),
  administrativeFee: z.string().nullable(),
  paymentMethod: z.string().nullable(),
  status: z.string(),
  referenceCode: z.string().nullable(),
});

export const withdrawalsPaginatedResponseSchema = z.object({
  message: z.string(),
  data: z.array(withdrawalListItemSchema),
  meta: metaSchema,
});

export const loanListItemSchema = z.object({
  id: z.string(),
  loanType: z.string().nullable(),
  interestRate: z.string().nullable(),
  loanAmount: z.string(),
  outstandingBalance: z.string().nullable(),
  installmentAmount: z.string().nullable(),
  requestDate: z.string().nullable(),
  terms: z.number().nullable(),
  status: z.string(),
  customReference: z.string().nullable(),
  progress: z.string(),
});

export const loansPaginatedResponseSchema = z.object({
  message: z.string(),
  data: z.array(loanListItemSchema),
  meta: metaSchema,
});

export const creditListItemSchema = z.object({
  id: z.string(),
  creditType: z.string().nullable(),
  interestRate: z.string().nullable(),
  creditAmount: z.string(),
  outstandingBalance: z.string().nullable(),
  installmentAmount: z.string().nullable(),
  requestDate: z.string().nullable(),
  terms: z.number().nullable(),
  status: z.string(),
  customReference: z.string().nullable(),
  progress: z.string(),
});

export const creditsPaginatedResponseSchema = z.object({
  message: z.string(),
  data: z.array(creditListItemSchema),
  meta: metaSchema,
});

export const transactionHistorySchema = z.object({
  tipo: z.string(),
  monto: z.string(),
  fecha: z.string().nullable(),
  descripcion: z.string().nullable(),
  numeroReferencia: z.string().nullable(),
  status: z.string(),
});

export const historyPaginatedResponseSchema = z.object({
  message: z.string(),
  data: z.array(transactionHistorySchema),
  meta: metaSchema,
});

export const amortizationItemSchema = z.object({
  id: z.string(),
  loanId: z.string().optional(),
  creditId: z.string().optional(),
  installmentNumber: z.number(),
  dueDate: z.string(),
  principalAmount: z.string(),
  interestAmount: z.string(),
  totalInstallmentAmount: z.string(),
  principalBalancePending: z.string(),
  paymentStatus: z.string(),
  paidAmount: z.string().nullable(),
  lastPaymentDate: z.string().nullable(),
});

export const loanDetailSchema = z.object({
  id: z.string(),
  associateId: z.string(),
  loanTypeId: z.string(),
  requestDate: z.string(),
  approvalDate: z.string().nullable(),
  disbursementDate: z.string().nullable(),
  requestedAmount: z.string(),
  approvedAmount: z.string().nullable(),
  disbursedAmount: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  interestRate: z.string().nullable(),
  termType: z.string().nullable(),
  termUnits: z.number().nullable(),
  totalInterest: z.string().nullable(),
  installmentAmount: z.string().nullable(),
  totalPayable: z.string().nullable(),
  expensesAmount: z.string().nullable(),
  overdraftAmount: z.string().nullable(),
  previousLoanId: z.string().nullable(),
  paymentMethod: z.string().nullable(),
  disbursementAccountId: z.string().nullable(),
  status: z.string(),
  rejectionReason: z.string().nullable(),
  notes: z.string().nullable(),
  customReference: z.string().nullable(),
  currencyCode: z.string().nullable(),
  balanceInFavor: z.string().nullable(),
  associateName: z.string(),
  associateCedula: z.string(),
  loanTypeName: z.string(),
});

export const loanDetailResponseSchema = z.object({
  loan: loanDetailSchema,
  amortizationSchedule: z.array(amortizationItemSchema),
  summary: z.object({
    totalPaid: z.number(),
    totalPending: z.number(),
    paidInstallments: z.number(),
    pendingInstallments: z.number(),
  }),
});

export const creditDetailSchema = z.object({
  id: z.string(),
  associateId: z.string(),
  creditTypeId: z.string(),
  requestDate: z.string(),
  approvalDate: z.string().nullable(),
  requestedAmount: z.string(),
  haberesPayment: z.string().nullable(),
  directPayment: z.string().nullable(),
  directPaymentMethod: z.string().nullable(),
  directPaymentReference: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  interestRate: z.string().nullable(),
  termType: z.string().nullable(),
  termUnits: z.number().nullable(),
  totalInterest: z.string().nullable(),
  installmentAmount: z.string().nullable(),
  totalPayable: z.string().nullable(),
  expensesAmount: z.string().nullable(),
  overdraftAmount: z.string().nullable(),
  previousCreditId: z.string().nullable(),
  status: z.string(),
  rejectionReason: z.string().nullable(),
  notes: z.string().nullable(),
  customReference: z.string().nullable(),
  currencyCode: z.string().nullable(),
  balanceInFavor: z.string().nullable(),
  associateName: z.string(),
  associateCedula: z.string(),
  creditTypeName: z.string(),
});

export const creditItemSaleSchema = z.object({
  id: z.string(),
  itemType: z.string(),
  itemDescription: z.string().nullable(),
  productName: z.string().nullable(),
  quantity: z.number(),
  agreedSellingPrice: z.string(),
  saleDate: z.string().nullable(),
  deliveryStatus: z.string(),
});

export const creditDetailResponseSchema = z.object({
  credit: creditDetailSchema,
  amortizationSchedule: z.array(amortizationItemSchema),
  items: z.array(creditItemSaleSchema),
  summary: z.object({
    totalPaid: z.number(),
    totalPending: z.number(),
    paidInstallments: z.number(),
    pendingInstallments: z.number(),
  }),
});

export const withdrawalDetailSchema = z.object({
  id: z.string(),
  associateAccountId: z.string(),
  withdrawalTypeId: z.string().nullable(),
  withdrawalDate: z.string().nullable(),
  requestedAmount: z.string(),
  administrativeFee: z.string().nullable(),
  disbursedAmount: z.string().nullable(),
  paymentMethod: z.string().nullable(),
  referenceCode: z.string().nullable(),
  status: z.string(),
  withdrawalItems: z.any().nullable(),
  commercialHouseId: z.string().nullable(),
  associateName: z.string(),
  associateCedula: z.string(),
  withdrawalTypeName: z.string().nullable(),
  isHouseComercial: z.boolean().nullable(),
  isInternalInventory: z.boolean().nullable(),
});

export const withdrawalDetailResponseSchema = z.object({
  withdrawal: withdrawalDetailSchema,
  items: z.array(z.any()),
});

export type AssociateStatement = z.infer<typeof associateStatementSchema>;
export type HaberesMovement = z.infer<typeof haberesMovementSchema>;
export type WithdrawalListItem = z.infer<typeof withdrawalListItemSchema>;
export type LoanListItem = z.infer<typeof loanListItemSchema>;
export type CreditListItem = z.infer<typeof creditListItemSchema>;
export type TransactionHistory = z.infer<typeof transactionHistorySchema>;

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
  id: z.number(),
  withdrawalDate: z.string(),
  description: z.string().nullable(),
  amount: z.string(),
  disbursedAmount: z.string().optional().nullable(),
  administrativeFee: z.string().optional().nullable(),
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
  id: z.number(),
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
  id: z.number(),
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

// Esquema para los detalles de un préstamo (GET /loan/:id/details)
export const loanDetailsSchema = z.object({
  id: z.number(),
  associateId: z.number(),
  companyId: z.number(),
  loanTypeId: z.number(),
  loanModality: z.string(),
  requestDate: z.string(),
  approvalDate: z.string().nullable(),
  disbursementDate: z.string().nullable(),
  requestedAmount: z.string(),
  approvedAmount: z.string().nullable(),
  disbursedAmount: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  totalInterest: z.string().nullable(),
  installmentAmount: z.string().nullable(),
  totalPayable: z.string().nullable(),
  expensesAmount: z.string().nullable(),
  overdraftAmount: z.string().nullable(),
  previousLoanId: z.number().nullable(),
  paymentMethod: z.string().nullable(),
  disbursementAccountId: z.number().nullable(),
  status: z.string(),
  rejectionReason: z.string().nullable(),
  approvedByUserId: z.number().nullable(),
  disbursedByUserId: z.number().nullable(),
  notes: z.string().nullable(),
  customReference: z.string().nullable(),
  currencyCode: z.string().nullable(),
  exchangeRateId: z.number().nullable(),
  balanceInFavor: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  associateName: z.string(),
  associateCedula: z.string(),
  loanTypeName: z.string(),
});

export const amortizationScheduleSchema = z.object({
  id: z.number(),
  loanId: z.number(),
  installmentNumber: z.number(),
  dueDate: z.string(),
  principalAmount: z.string(),
  interestAmount: z.string(),
  totalInstallmentAmount: z.string(),
  principalBalancePending: z.string(),
  paymentStatus: z.string(),
  paidAmount: z.string().nullable(),
  lastPaymentDate: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
});

export const loanStatusHistorySchema = z.object({
  id: z.number(),
  loanId: z.number(),
  status: z.string(),
  changedAt: z.string(),
  changedByUserId: z.number().nullable(),
  comment: z.string().nullable(),
});

export const loanDetailsResponseSchema = z.object({
  loan: loanDetailsSchema,
  amortizationSchedule: z.array(amortizationScheduleSchema),
  statusHistory: z.array(loanStatusHistorySchema),
  summary: z.object({
    totalPaid: z.number(),
    totalPending: z.number(),
    paidInstallments: z.number(),
    pendingInstallments: z.number(),
  }),
});

// Esquema para los detalles de un crédito (GET /credit/:id/details)
export const creditDetailsSchema = z.object({
  id: z.number(),
  associateId: z.number(),
  companyId: z.number(),
  creditTypeId: z.number(),
  creditModality: z.string(),
  requestDate: z.string(),
  approvalDate: z.string().nullable(),
  requestedAmount: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  totalInterest: z.string().nullable(),
  installmentAmount: z.string().nullable(),
  totalPayable: z.string().nullable(),
  expensesAmount: z.string().nullable(),
  overdraftAmount: z.string().nullable(),
  previousCreditId: z.number().nullable(),
  status: z.string(),
  rejectionReason: z.string().nullable(),
  approvedByUserId: z.number().nullable(),
  notes: z.string().nullable(),
  customReference: z.string().nullable(),
  currencyCode: z.string().nullable(),
  exchangeRateId: z.number().nullable(),
  balanceInFavor: z.string().nullable(),
  commercialHouseId: z.number().nullable(),
  invoiceNumber: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  associateName: z.string(),
  associateCedula: z.string(),
  creditTypeName: z.string(),
});

export const creditAmortizationScheduleSchema = z.object({
  id: z.number(),
  creditId: z.number(),
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

export const creditStatusHistorySchema = z.object({
  id: z.number(),
  creditId: z.number(),
  status: z.string(),
  changedAt: z.string(),
  changedByUserId: z.number().nullable(),
  comment: z.string().nullable(),
});

export const creditItemSalesSchema = z.object({
  id: z.number(),
  creditId: z.number(),
  itemType: z.string(),
  itemId: z.number(),
  quantity: z.number(),
  agreedSellingPrice: z.string(),
  saleDate: z.string(),
  deliveryStatus: z.string(),
  days: z.number().nullable(),
  itemName: z.string().nullable(),
});

export const creditDetailsResponseSchema = z.object({
  credit: creditDetailsSchema,
  amortizationSchedule: z.array(creditAmortizationScheduleSchema),
  statusHistory: z.array(creditStatusHistorySchema),
  items: z.array(creditItemSalesSchema),
  summary: z.object({
    totalPaid: z.number(),
    totalPending: z.number(),
    paidInstallments: z.number(),
    pendingInstallments: z.number(),
  }),
});

// Esquema para los detalles de un retiro (GET /savings-banks/withdrawal-associate/:id/details)
export const withdrawalDetailsSchema = z.object({
  id: z.number(),
  associateAccountId: z.number(),
  withdrawalTypeId: z.number(),
  withdrawalDate: z.string(),
  requestedAmount: z.string(),
  administrativeFee: z.string().nullable(),
  disbursedAmount: z.string().nullable(),
  paymentMethod: z.string().nullable(),
  referenceCode: z.string().nullable(),
  status: z.string(),
  commercialHouseId: z.number().nullable(),
  withdrawalItems: z.any().nullable(),
  associateName: z.string(),
  associateCedula: z.string(),
  withdrawalTypeName: z.string(),
});

export const withdrawalItemDetailsSchema = z.object({
  itemType: z.string(),
  itemId: z.number().nullable(),
  quantity: z.number(),
  agreedSellingPrice: z.number().nullable().optional(),
  itemName: z.string().nullable(),
});

export const withdrawalDetailsResponseSchema = z.object({
  withdrawal: withdrawalDetailsSchema,
  items: z.array(withdrawalItemDetailsSchema),
});

export type AssociateDetails = z.infer<typeof associateDetailsSchema>;

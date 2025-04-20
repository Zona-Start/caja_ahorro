import { PaymentStatusEnum } from '@/types/enum';

export class LoanAmortizationSchedule {
  id: number;
  loanId: number; // Corresponds to loan_id in the schema
  installmentNumber: number;
  dueDate: Date;
  principalAmount: number;
  interestAmount: number;
  totalInstallmentAmount: number;
  principalBalancePending: number;
  paymentStatus: PaymentStatusEnum;
  paidAmount?: number | null; // Default is '0.00' but can be null initially
  lastPaymentDate?: Date | null;
  createdAt: Date;
  updatedAt?: Date | null;
  createdById?: number | null; // Assuming these might exist based on timestamps helper
  updatedById?: number | null; // Assuming these might exist based on timestamps helper
}

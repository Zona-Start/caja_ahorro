import { loanModalityTypeEnum, paymentMethodEnum } from '@/types/enum';

export class LoanPaid {
  id: number;
  loanId: number;
  installmentId?: number | null; // Puede ser nulo si el pago no es a una cuota específica
  paymentDate: Date;
  paymentType: loanModalityTypeEnum;
  amount: number; // En el schema es numeric, en TS se maneja como number
  bankId: number;
  paymentMethod: paymentMethodEnum;
  transactionReference?: string | null;
  comment?: string | null;
  createdAt: Date; // Corresponde a timestamps.createdAt
  updatedAt?: Date | null; // Corresponde a timestamps.updatedAt
}

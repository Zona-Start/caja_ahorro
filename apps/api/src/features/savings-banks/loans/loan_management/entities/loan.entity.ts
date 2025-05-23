import { loanModalityTypeEnum, LoanStatusEnum } from '@/types/enum';

export class Loan {
  id: number;
  associateId: number;
  amount: number; // Monto solicitado/original (corresponde a requestedAmount)
  termMonths: number; // Plazo en meses (no existe un campo directo, se podría calcular o almacenar aparte)
  interestRate: number; // Tasa de interés anual aplicada (no existe un campo directo, se podría calcular o almacenar aparte)
  totalInterestAmount: number; // Monto total de interés calculado (corresponde a totalInterest)
  totalAmount: number; // Monto total a pagar (principal + interés) (corresponde a totalPayable)
  monthlyPayment: number; // Cuota mensual calculada (corresponde a installmentAmount)
  status: LoanStatusEnum;
  requestDate: Date;
  approvalDate?: Date | null; // Fecha de aprobación (si aplica) (corresponde a approvalDate)
  disbursementDate?: Date | null; // Fecha de desembolso (si aplica) (corresponde a disbursementDate)
  customReference?: string | null; // Referencia única generada (si aplica) (corresponde a customReference)
  purpose?: string | null; // Propósito del préstamo (no existe un campo directo)
  notes?: string | null; // Notas adicionales (corresponde a notes)
  createdById?: number; // No mapeado directamente, se infiere del usuario que crea el registro
  updatedById?: number | null; // No mapeado directamente, se infiere del usuario que actualiza el registro
  createdAt: Date; // Corresponde a timestamps.createdAt
  updatedAt?: Date | null; // Corresponde a timestamps.updatedAt
  // Campos que existen en la base de datos pero no directamente en la Entity original:
  companyId?: number;
  loanTypeId?: number;
  loanModality: loanModalityTypeEnum;
  approvedAmount?: number | null;
  disbursedAmount?: number | null;
  startDate?: Date | null;
  endDate?: Date | null;
  expensesAmount?: number | null;
  overdraftAmount?: number | null;
  previousLoanId?: number | null;
  paymentMethod?: string;
  disbursementAccountId?: number | null;
  rejectionReason?: string | null;
  approvedByUserId?: number | null;
  disbursedByUserId?: number | null;
  currencyCode?: string;
  exchangeRateId?: number | null;
}

import { LoanStatusEnum } from '@/types/enum';

export class Loan {
  id: number;
  associateId: number;
  amount: number; // Monto solicitado/original
  termMonths: number; // Plazo en meses
  interestRate: number; // Tasa de interés anual aplicada
  totalInterestAmount: number; // Monto total de interés calculado
  totalAmount: number; // Monto total a pagar (principal + interés)
  monthlyPayment: number; // Cuota mensual calculada
  status: LoanStatusEnum;
  requestDate: Date;
  approvalDate?: Date | null; // Fecha de aprobación (si aplica)
  disbursementDate?: Date | null; // Fecha de desembolso (si aplica)
  customReference?: string | null; // Referencia única generada (si aplica)
  purpose?: string | null; // Propósito del préstamo
  notes?: string | null; // Notas adicionales
  createdById?: number;
  updatedById?: number | null;
  createdAt: Date;
  updatedAt?: Date | null;

  // You might want to add relations here later if needed, e.g.:
  // associate?: Associate;
  // amortizationSchedule?: LoanAmortizationSchedule[];
  // statusHistory?: LoanStatusHistory[];
}

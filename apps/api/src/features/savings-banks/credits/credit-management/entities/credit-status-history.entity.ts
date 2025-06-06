import { LoanStatusEnum } from '@/types/enum';

export class CreditStatusHistory {
  id: number;
  loanId: number;
  status: LoanStatusEnum;
  changedAt: Date; // Corresponds to changed_at in the schema
  changedByUserId?: number | null; // Corresponds to changed_by_user_id
  comment?: string | null;
}

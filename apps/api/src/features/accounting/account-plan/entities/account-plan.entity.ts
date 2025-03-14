export class AccountPlan {
    id?: number;
    savingBankId?: number;
    code: string;
    name: string;
    type: string;
    description: string | null;
    level: number;
    parent_account_id?: number | null;
    created_at?: Date;
    updated_at?: Date;
  }



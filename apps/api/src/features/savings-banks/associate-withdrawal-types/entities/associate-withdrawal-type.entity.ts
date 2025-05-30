export class AssociateWithdrawalType {
  id: number;
  description: string;
  withdrawalPercentage: string | null;
  accountDebit: number | null;
  expenseAccount: number | null;
  administrativeFeePercentage: string;
  withdrawalLimitQuantity: number | null;
  minimumAntiquityDays: number | null;
  withdrawalFrequencyRelation: number | null;
  createdAt?: Date;
  updatedAt?: Date;
  createdById?: number | null;
  updatedById?: number | null;
}

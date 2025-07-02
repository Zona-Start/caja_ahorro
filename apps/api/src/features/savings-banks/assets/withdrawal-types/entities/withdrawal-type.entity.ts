export class WithdrawalType {
  id: number;
  description: string;
  withdrawalPercentage?: number;
  accountDebit?: number;
  expenseAccount?: number;
  administrativeFeePercentage?: number;
  withdrawalLimitQuantity?: number;
  minimumAntiquityDays?: number;
  withdrawalFrequencyRelation?: number;
  createdAt: Date;
  updatedAt: Date;
}

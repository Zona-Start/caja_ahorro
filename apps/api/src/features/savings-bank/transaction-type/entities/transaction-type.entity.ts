export class TransactionType {
  id: number;
  code: string;
  description: string;
  deferredDate: Date;
  dateCanceled: Date;
  deferredNumber?: number;
  numberCanceled?: number;
  associatedAccount?: number;
  employerAccount?: number;
  loanAccount?: number;
  createdAt?: Date;
  updatedAt?: Date;
  createdById?: number;
  updateById?: number;
}

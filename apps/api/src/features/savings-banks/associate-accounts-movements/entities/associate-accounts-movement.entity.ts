export class AssociateAccountsMovement {
  id: number;
  associateAccountId: number;
  movementType: string; // Corresponderá a uno de los valores del enum associateMovementTypeEnum
  amount: number;
  currencyCode: string; // Corresponderá a uno de los valores del enum currencyCodeEnum
  transactionDate: Date;
  description?: string;
  referenceId?: string;
  referenceType?: string;
  exchangeRateId?: number;
  createdAt?: Date;
  updatedAt?: Date;
  createdById?: number;
  updatedById?: number;
}

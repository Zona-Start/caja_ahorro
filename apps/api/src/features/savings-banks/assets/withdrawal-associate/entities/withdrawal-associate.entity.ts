import { paymentMethodEnum } from '@/types/enum';

export class WithdrawalsAssociates {
  id: number;
  associateAccountId: number;
  withdrawalTypeId: number;
  withdrawalDate: Date;
  requestedAmount: number;
  administrativeFee: number;
  disbursedAmount: number;
  paymentMethod: paymentMethodEnum;
  referenceCode: string | null;
  createdAt: Date;
  updatedAt?: Date | null;
  createdById: number | null;
  updatedById?: number | null;
}

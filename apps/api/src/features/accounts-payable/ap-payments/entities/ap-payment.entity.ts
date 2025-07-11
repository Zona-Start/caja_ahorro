import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethodEnum, PaymentSuppliersStatusEnum } from '@/types/enum';

export class ApPayment {
  @ApiProperty({ required: false })
  id?: number;

  @ApiProperty()
  payableId: number;

  @ApiProperty()
  paymentDate: Date;

  @ApiProperty()
  amountPaid: number;

  @ApiProperty({ enum: PaymentMethodEnum, enumName: 'PaymentMethodEnum' })
  paymentMethod: PaymentMethodEnum;

  @ApiProperty()
  transactionReference: string;

  @ApiProperty({ enum: PaymentSuppliersStatusEnum, enumName: 'PaymentSuppliersStatusEnum' })
  status: PaymentSuppliersStatusEnum;

  @ApiProperty({ required: false })
  observations?: string;

  @ApiProperty()
  isReversed: boolean;

  @ApiProperty({ required: false })
  createdAt?: Date;

  @ApiProperty({ required: false })
  updatedAt?: Date;

  @ApiProperty({ required: false })
  createdById?: number;

  @ApiProperty({ required: false })
  updatedById?: number;
}

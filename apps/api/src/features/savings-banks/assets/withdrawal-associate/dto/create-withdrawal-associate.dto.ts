import { paymentMethodEnum } from '@/types/enum';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  Min,
} from 'class-validator';

export class CreateWithdrawalAssociateDto {
  @IsInt()
  @IsNotEmpty()
  associateAccountId: number;

  @IsInt()
  @IsNotEmpty()
  withdrawalTypeId: number;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  withdrawalDate: Date; // Fecha de pago

  @IsNumber()
  @IsPositive()
  @Min(1)
  @IsNotEmpty()
  requestedAmount: number; // Monto de pago

  @IsEnum(paymentMethodEnum)
  paymentMethod: paymentMethodEnum;
}

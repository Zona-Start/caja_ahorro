import { paymentMethodEnum } from '@/database';
import { AssociateMovementTypeEnum, CurrencyCodeEnum } from '@/types/enum';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class IndividualLoadDto {
  @IsNotEmpty()
  @IsNumber()
  associateAccountId: number;

  @IsNotEmpty()
  @IsEnum(AssociateMovementTypeEnum)
  movementType: AssociateMovementTypeEnum;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsEnum(CurrencyCodeEnum)
  currencyCode: CurrencyCodeEnum;

  @IsOptional()
  @IsDate()
  transactionDate?: Date; // Si no se proporciona, se usará el valor por defecto de la base de datos

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsNotEmpty()
  @IsNumber()
  bankAccountId: number;

  @IsEnum(paymentMethodEnum.enumValues)
  @IsNotEmpty()
  paymentMethod: (typeof paymentMethodEnum.enumValues)[number];
}

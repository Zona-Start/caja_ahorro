import { paymentMethodEnum } from '@/database';
import { AssociateMovementTypeEnum } from '@/types/enum';
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

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsNumber()
  employerAmount?: number;

  @IsOptional()
  @IsNumber()
  associateAmount?: number;

  @IsNotEmpty()
  @IsDate()
  transactionDate: Date; // Si no se proporciona, se usará el valor por defecto de la base de datos

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsOptional()
  @IsNumber()
  bankAccountId?: number;

  @IsEnum(paymentMethodEnum.enumValues)
  @IsOptional()
  paymentMethod?: (typeof paymentMethodEnum.enumValues)[number];
}

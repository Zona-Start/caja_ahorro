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

  @IsNotEmpty()
  @IsString()
  referenceNumber: string;

  @IsNotEmpty()
  @IsNumber()
  bankAccountId: number;

  @IsNotEmpty()
  @IsEnum(paymentMethodEnum.enumValues)
  paymentMethod: (typeof paymentMethodEnum.enumValues)[number];
}

export class BulkIndividualLoadDto {
  @IsNotEmpty()
  @IsNumber()
  bankAccountId: number;

  @IsNotEmpty()
  @IsEnum(paymentMethodEnum.enumValues)
  paymentMethod: (typeof paymentMethodEnum.enumValues)[number];

  @IsNotEmpty()
  @IsString()
  referenceNumber: string;

  @IsNotEmpty()
  @IsDate()
  transactionDate: Date;

  @IsOptional()
  @IsString()
  description?: string;
}

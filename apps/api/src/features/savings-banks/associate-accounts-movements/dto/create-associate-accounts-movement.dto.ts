import {
  AssociateMovementTypeEnum,
  CurrencyCodeEnum,
  movementStatusEnum,
} from '@/types/enum';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAssociateAccountsMovementDto {
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
  referenceId?: string;

  @IsOptional()
  @IsString()
  referenceType?: string;

  @IsOptional()
  @IsString()
  area?: string;

  @IsOptional()
  @IsEnum(movementStatusEnum)
  status?: movementStatusEnum;
}

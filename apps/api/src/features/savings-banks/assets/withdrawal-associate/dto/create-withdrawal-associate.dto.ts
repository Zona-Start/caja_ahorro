import { paymentMethodEnum } from '@/types/enum';
import { Type } from 'class-transformer';

import {
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class WithdrawalItemDto {
  @IsString()
  @IsNotEmpty()
  itemType: string;

  @IsString()
  @IsOptional()
  itemDescription?: string | null;

  @IsInt()
  @IsOptional()
  itemId?: number | null;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @IsPositive()
  agreedSellingPrice: number;

  @IsString()
  @IsOptional()
  days?: string | null;
}

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

  @IsInt()
  @IsOptional()
  commercialHouseId?: number | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WithdrawalItemDto)
  @IsOptional()
  withdrawalItems?: WithdrawalItemDto[];
}

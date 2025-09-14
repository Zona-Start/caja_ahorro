import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateWithdrawalTypeDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message: 'withdrawalPercentage debe ser un número con hasta 2 decimales',
    },
  )
  @Min(0)
  @Max(100)
  withdrawalPercentage?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  accountDebit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  expenseAccount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message:
        'administrativeFeePercentage debe ser un número con hasta 2 decimales',
    },
  )
  @Min(0)
  @Max(100)
  administrativeFeePercentage?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  withdrawalLimitQuantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minimumAntiquityDays?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  withdrawalFrequencyRelation?: number;

  @IsBoolean()
  @IsNotEmpty()
  isHouseComercial: boolean;

  @IsBoolean()
  @IsNotEmpty()
  isInternalInventory: boolean;
}

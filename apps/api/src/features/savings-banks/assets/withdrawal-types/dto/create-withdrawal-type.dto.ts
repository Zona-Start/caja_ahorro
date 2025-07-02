import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWithdrawalTypeDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'withdrawalPercentage debe ser un número con hasta 2 decimales' })
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
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'administrativeFeePercentage debe ser un número con hasta 2 decimales' })
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
}
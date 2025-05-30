import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAssociateWithdrawalTypeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsNotEmpty()
  withdrawalPercentage: string;

  @ApiProperty({ required: false })
  @IsInt()
  @IsNotEmpty()
  accountDebit?: number;

  @ApiProperty({ required: false })
  @IsInt()
  @IsNotEmpty()
  expenseAccount?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  administrativeFeePercentage?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  withdrawalLimitQuantity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  minimumAntiquityDays?: number;

  @ApiProperty({ required: false })
  @IsInt()
  @IsNotEmpty()
  withdrawalFrequencyRelation?: number;
}

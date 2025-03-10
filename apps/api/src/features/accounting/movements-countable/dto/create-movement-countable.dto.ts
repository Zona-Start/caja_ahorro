import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateMovementCountableDto {
  @ApiProperty({ description: 'Transaction ID' })
  @IsNumber()
  transaction_id: bigint;

  @ApiProperty({ description: 'Account plan ID' })
  @IsInt()
  accountPlanId: number;

  @ApiProperty({ description: 'Debit amount', default: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  debit?: number;

  @ApiProperty({ description: 'Credit amount', default: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  havings?: number;

  @ApiProperty({ description: 'Movement description', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

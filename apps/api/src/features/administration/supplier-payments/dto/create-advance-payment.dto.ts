import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAdvancePaymentDto {
  @IsInt()
  @IsNotEmpty()
  supplierId: number;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string; // Debería ser un enum

  @IsInt()
  @IsOptional()
  bankAccountId?: number;

  @ApiPropertyOptional({ description: ' Bank bank reference' })
  @IsString()
  @IsOptional()
  bankReference: string;

  @ApiPropertyOptional({ description: ' Bank description' })
  @IsString()
  @IsOptional()
  bankDescription: string;

  @ApiPropertyOptional({ description: 'Transaction date' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  bankTransactionDate: Date;

  @IsString()
  @IsOptional()
  observations?: string;
}

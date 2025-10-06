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

export class CreateSupplierPaymenAdvanceDto {
  @IsInt()
  @IsNotEmpty()
  supplierId: number;

  @IsInt()
  @IsNotEmpty()
  transactionId: number;

  @IsInt()
  @IsNotEmpty()
  bankAccountId: number;

  @ApiPropertyOptional({ description: ' Bank description' })
  @IsString()
  @IsOptional()
  paymentDescription: string;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string; // Debería ser un enum

  @ApiPropertyOptional({ description: ' Bank bank reference' })
  @IsString()
  @IsOptional()
  bankReference: string;

  @ApiPropertyOptional({ description: 'Transaction date' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  transactionDate: Date;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsOptional()
  currencyCode?: string;
}

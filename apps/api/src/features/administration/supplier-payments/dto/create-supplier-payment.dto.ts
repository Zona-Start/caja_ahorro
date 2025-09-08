import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

class CreateSupplierPaymentLineDto {
  @IsOptional()
  @IsInt()
  accountsPayableId?: number;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateSupplierPaymentDto {
  @IsInt()
  @IsNotEmpty()
  supplierId: number;

  @IsNumber()
  @IsNotEmpty()
  totalAmount: number;

  @IsString()
  @IsOptional()
  currencyCode: string; // Debería ser un enum, pero string para simplicidad inicial

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

  @IsArray()
  @Type(() => CreateSupplierPaymentLineDto)
  lines: CreateSupplierPaymentLineDto[];
}

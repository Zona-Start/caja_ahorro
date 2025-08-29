import { paymentMethodEnum } from '@/database';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateBankMovementDto {
  @ApiProperty({
    description: 'The ID of the bank account associated with the transaction.',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  bankAccountId: number;

  @ApiProperty({
    description: 'The date of the transaction.',
    example: '2024-07-15',
  })
  @IsDateString()
  @IsNotEmpty()
  transactionDate: string;

  @ApiProperty({
    description: 'Transaction Type',
    enum: paymentMethodEnum.enumValues,
  })
  @IsEnum(paymentMethodEnum.enumValues)
  @IsNotEmpty()
  transactionType: (typeof paymentMethodEnum.enumValues)[number];

  @ApiProperty({
    description: 'The description of the transaction.',
    example: 'Payment for services',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'The debit amount of the transaction.',
    example: 100.5,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  debitAmount?: number;

  @ApiProperty({
    description: 'The credit amount of the transaction.',
    example: 50.25,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  creditAmount?: number;

  @ApiProperty({
    description: 'The bank reference for the transaction.',
    example: 'REF123456',
    required: false,
  })
  @IsString()
  @IsOptional()
  bankReference?: string;

  @ApiProperty({
    description: 'Create for user id.',
    required: false,
  })
  @IsInt()
  @IsOptional()
  createdById?: number;
}

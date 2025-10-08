import { BankTransactionCategory, paymentMethodEnum } from '@/types/enum';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
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
  @IsDate()
  @IsNotEmpty()
  transactionDate: Date;

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
    description: 'bank category',
    enum: BankTransactionCategory,
  })
  @IsEnum(BankTransactionCategory)
  category?: BankTransactionCategory;

  @ApiProperty({
    description: 'Payment Method',
    enum: paymentMethodEnum,
  })
  @IsEnum(paymentMethodEnum)
  @IsNotEmpty()
  paymentMethod: paymentMethodEnum;

  @ApiProperty({
    description: 'The bank reference for the transaction.',
    example: 'REF123456',
    required: false,
  })
  @IsString()
  @IsOptional()
  bankReference?: string;

  @ApiProperty({
    description: 'The description of the transaction.',
    example: 'Payment for services',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Create for user id.',
    required: false,
  })
  @IsInt()
  @IsOptional()
  createdById?: number;
}

export class LinkItemDto {
  @IsString()
  internalRecordType: string;
  @IsNumber()
  internalRecordId: number;
}

export class CreateAndReconcileDto {
  @IsNotEmptyObject()
  @ValidateNested()
  movement: CreateBankMovementDto;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => LinkItemDto)
  links?: LinkItemDto[];
}

export class ReconcileBankDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LinkItemDto)
  links: LinkItemDto[];
}

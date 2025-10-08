// src/modules/bank-movements/dto/get-linkables.dto.ts
import { BankTransactionCategory } from '@/types/enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum } from 'class-validator';

export class GetLinkablesDto {
  @ApiProperty({
    description: 'bank category',
    enum: BankTransactionCategory,
  })
  @IsEnum(BankTransactionCategory)
  category?: BankTransactionCategory;

  @IsDateString()
  valueDate!: string; // ISO date
}

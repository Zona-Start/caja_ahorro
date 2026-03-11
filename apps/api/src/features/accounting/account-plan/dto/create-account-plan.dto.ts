import { AccountNatureEnum, AccountTypeEnum } from '@/types/enum';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateAccountPlanDto {
  @ApiProperty({ description: 'Company ID' })
  @IsInt()
  companyId: number;

  @ApiProperty({ description: 'Account code (e.g. 1.1.1)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: 'Account name (e.g. "Caja")' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    enum: AccountTypeEnum,
    enumName: 'AccountTypeEnum',
    description:
      'Account type:  ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE, MEMORANDUM',
  })
  @IsEnum(AccountTypeEnum)
  @IsNotEmpty()
  accountType: AccountTypeEnum;

  @ApiProperty({ description: 'Account description (e.g. "Caja")' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    enum: AccountNatureEnum,
    enumName: 'AccountNatureEnum',
    description: 'Account type: DEBIT, CREDIT,',
  })
  @IsEnum(AccountNatureEnum)
  @IsNotEmpty()
  nature: AccountNatureEnum;

  @ApiProperty({ description: 'Account level in the hierarchy (e.g. 1, 2, 3)' })
  @IsInt()
  level: number;

  @ApiProperty({
    description:
      'True if it is a detail account (attributable), False if it is a grouping account',
  })
  @IsNotEmpty()
  @IsBoolean()
  allowsMovements: boolean;

  @ApiProperty({ description: 'active o false' })
  @IsOptional()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ description: 'Parent account ID', required: false })
  @IsInt()
  @IsOptional()
  parentAccountId?: number;
}

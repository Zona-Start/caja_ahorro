import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateAccountingConfigurationDto {
  @ApiProperty({ description: 'Company ID' })
  @IsInt()
  companyId: number;

  @ApiProperty({ description: 'Key' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  key: string;

  @ApiProperty({ description: 'Operation type' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  operationType: string;

  @ApiProperty({ description: 'Description template', required: false })
  @IsString()
  @IsOptional()
  descriptionTemplate?: string;

  @ApiProperty({ description: 'Debit account ID', required: false })
  @IsInt()
  @IsOptional()
  debitAccountId?: number;

  @ApiProperty({ description: 'Credit account ID', required: false })
  @IsInt()
  @IsOptional()
  creditAccountId?: number;

  @ApiProperty({ description: 'Contra account ID', required: false })
  @IsInt()
  @IsOptional()
  contraAccountId?: number;

  @ApiProperty({ description: 'Is active', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateAccountPlanDto {
  @ApiProperty({ description: 'Savings bank ID' })
  @IsInt()
  savingBankId: number;

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
    description: 'Account type: activo, pasivo, patrimonio, ingreso, gasto',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  type: string;

  @ApiProperty({ description: 'Account level in the hierarchy (e.g. 1, 2, 3)' })
  @IsInt()
  level: number;

  @ApiProperty({ description: 'Parent account ID', required: false })
  @IsInt()
  @IsOptional()
  parent_account_id?: number;
}

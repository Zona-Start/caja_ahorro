import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateAccountingRuleDetailDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  ruleId?: number;

  @ApiProperty({
    description: 'Role of the account in the rule, e.g., ASOCIADO_CUENTA',
    required: false,
  })
  @IsOptional()
  @IsString()
  accountRole?: string;

  @ApiProperty({ enum: ['DEBIT', 'CREDIT'] })
  @IsNotEmpty()
  @IsEnum(['DEBIT', 'CREDIT'])
  movementType: 'DEBIT' | 'CREDIT';

  @ApiProperty({
    required: false,
    description: 'Optional formula for calculation',
  })
  @IsOptional()
  @IsString()
  formula?: string;

  @ApiProperty({
    required: false,
    description: 'ID of the specific account if applicable',
  })
  @IsOptional()
  @IsInt()
  accountPlanId?: number;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isAuxiliary?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isAuxiliarySupplier?: boolean;
}

export class CreateAccountingRuleDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  companyId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  operationType: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  referenceId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ type: [CreateAccountingRuleDetailDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAccountingRuleDetailDto)
  details: CreateAccountingRuleDetailDto[];
}

import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateBankReconciliationDto {
  @IsInt()
  @IsNotEmpty()
  bankAccountId: number;

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  statementDate: Date;

  @IsNumber()
  @IsNotEmpty()
  statementEndingBalance: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

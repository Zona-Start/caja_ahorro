import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class AddReconciliationDetailDto {
  @IsInt()
  @IsOptional()
  bankTransactionId?: number;

  @IsInt()
  @IsOptional()
  accountingEntryDetailId?: number;

  @IsString()
  @IsOptional()
  adjustmentType?: string;

  @IsNumber()
  @IsOptional()
  adjustmentAmount?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isBookAdjustment?: boolean;
}

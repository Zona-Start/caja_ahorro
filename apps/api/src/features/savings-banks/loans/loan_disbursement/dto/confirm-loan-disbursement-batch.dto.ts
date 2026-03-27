import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ConfirmLoanBatchItemResultDto {
  @IsInt()
  @IsPositive()
  itemId: number; // id del paymentBatchItem

  @IsIn(['PROCESSED', 'REJECTED'])
  status: 'PROCESSED' | 'REJECTED';

  @IsString()
  @IsOptional()
  reason?: string;
}

/** DTO para confirmar (procesar/rechazar) un lote de desembolso de préstamos */
export class ConfirmLoanDisbursementBatchDto {
  @IsDate()
  @Type(() => Date)
  processedAt: Date;

  @IsString()
  @IsOptional()
  bankReference?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ConfirmLoanBatchItemResultDto)
  items: ConfirmLoanBatchItemResultDto[];
}

import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ConfirmPaymentBatchDto {
  @IsString()
  @IsOptional()
  bankReference?: string;

  @IsDate()
  @IsNotEmpty()
  processedAt: Date;
}

import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { paymentMethodEnum, loanPaymetTypeEnum } from '@/types/enum';

export class CreateBulkLoanPaidDto {
  @IsString()
  bankId: string; // Recibido como string en FormData

  @IsEnum(paymentMethodEnum)
  paymentMethod: paymentMethodEnum;

  @IsEnum(loanPaymetTypeEnum)
  paymentType: loanPaymetTypeEnum;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsString()
  @IsOptional()
  transactionReference?: string;

  @IsString()
  @IsOptional()
  paymentDate?: string;
}

import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class DisburseWithdrawalAssociateDto {
  @IsNotEmpty()
  @IsNumber()
  bankAccountId: number;

  @IsNotEmpty()
  @IsDateString()
  processedAt: string;

  @IsOptional()
  @IsString()
  bankReference?: string;
}

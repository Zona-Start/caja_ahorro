import { IsOptional } from 'class-validator';
import { CreateLoanTypeDto } from './create-loan-type.dto';

export class UpdateLoanTypeDto extends CreateLoanTypeDto {
  @IsOptional()
  name: string;

  @IsOptional()
  interestRate_annual: number;

  @IsOptional()
  maxLoanAmount: number;

  @IsOptional()
  minLoanAmount: number;

  @IsOptional()
  termMonthsMin: number;

  @IsOptional()
  termMonthsMax: number;
}

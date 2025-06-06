import { IsOptional } from 'class-validator';
import { CreateCreditTypeDto } from './create-credit-type.dto';

export class UpdateCreditTypeDto extends CreateCreditTypeDto {
  @IsOptional()
  name: string;

  @IsOptional()
  interestRate_annual: number;

  @IsOptional()
  maxCreditAmount: number;

  @IsOptional()
  minCreditAmount: number;

  @IsOptional()
  termMonthsMin: number;

  @IsOptional()
  termMonthsMax: number;
}

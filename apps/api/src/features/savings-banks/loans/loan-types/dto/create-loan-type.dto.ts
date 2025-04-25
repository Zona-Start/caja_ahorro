import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateLoanTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  interestRateAnnual: number;

  @IsNumber()
  @IsOptional()
  maxLoanAmount: number;

  @IsNumber()
  @IsOptional()
  minLoanAmount: number;

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  termMonthsMin: number;

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  termMonthsMax: number;
}

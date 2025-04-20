import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
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
  @Min(0)
  @Max(100)
  @IsNotEmpty()
  interestRate_annual: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  maxLoanAmount: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
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

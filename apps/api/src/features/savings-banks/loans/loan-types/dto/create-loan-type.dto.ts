import {
  IsBoolean,
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
  @Min(0)
  @IsNotEmpty()
  interestRate: number;

  @IsString()
  @IsNotEmpty()
  termType: 'CUOTAS' | 'PLAZO';

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  termUnits: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  cancellationPercentage?: number;

  @IsNumber()
  @IsNotEmpty()
  loanAccountChartId: number;

  @IsNumber()
  @IsNotEmpty()
  interestEarnedAccountChartId: number;

  @IsNumber()
  @IsOptional()
  specialQuotaAccountChartId?: number;

  @IsNumber()
  @IsOptional()
  expenseAccountChartId?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  specialQuotaNumber?: number = 0;

  @IsNumber()
  @Min(0)
  @IsOptional()
  specialQuotaPercentage?: number = 0;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxLoanAmount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minLoanAmount?: number;

  @IsNumber()
  @IsOptional()
  payrollTypeId?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  administrativeExpensePercentage?: number = 0;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minimumSeniorityMonths?: number = 0;

  @IsBoolean()
  @IsOptional()
  acceptsDebitBalance?: boolean = false;

  @IsBoolean()
  @IsOptional()
  acceptsGuarantors?: boolean = false;

  @IsBoolean()
  @IsOptional()
  acceptsAvailability?: boolean = false;

  @IsBoolean()
  @IsOptional()
  acceptsRefinancing?: boolean = false;
}

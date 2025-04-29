import {
  IsArray,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTypePayrollDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDate()
  @IsOptional()
  deferredDate: Date;

  @IsDate()
  @IsOptional()
  dateCanceled: Date;

  @IsNumber()
  @IsOptional()
  deferredNumber?: number;

  @IsNumber()
  @IsOptional()
  numberCanceled?: number;

  @IsString()
  @IsNotEmpty()
  group: string; // Ej: 'PAYROLL_TYPE', 'WORKER_TYPE', 'DISCOUNT_FREQ', 'ASSOCIATE_ACCOUNT_TYPE'

  @IsOptional()
  @IsArray()
  metadata: any; // Opciones extra en formato JSON si es necesario

  @IsNumber()
  @IsOptional()
  associatedAccount?: number;

  @IsNumber()
  @IsOptional()
  employerAccount?: number;

  @IsNumber()
  @IsOptional()
  loanAccount?: number;

  @IsNumber()
  @IsOptional()
  createdById?: number;

  @IsNumber()
  @IsOptional()
  updateById?: number;
}

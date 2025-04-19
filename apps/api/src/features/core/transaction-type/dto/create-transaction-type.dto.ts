import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTransactionTypeDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDate()
  @IsNotEmpty()
  deferredDate: Date;

  @IsDate()
  @IsNotEmpty()
  dateCanceled: Date;

  @IsNumber()
  @IsOptional()
  deferredNumber?: number;

  @IsNumber()
  @IsOptional()
  numberCanceled?: number;

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

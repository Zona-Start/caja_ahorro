import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAdvanceSupplierDto {
  @ApiPropertyOptional({ description: 'Supplier ID' })
  @IsInt()
  @IsNotEmpty()
  supplierId: number;

  @ApiPropertyOptional({ description: 'Amount' })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsOptional()
  observations?: string;
}

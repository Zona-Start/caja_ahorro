import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAccountAssociateDto {
  @ApiProperty({ description: 'Associated ID' })
  @IsInt()
  @IsNotEmpty()
  associatedId: number;

  @ApiProperty({ description: 'Initial balance', required: false })
  @IsOptional()
  @IsNumber()
  balance?: number;

  @ApiProperty({ description: 'Account number' })
  @IsNotEmpty()
  @IsNumber()
  accountNumber: number;

  @ApiProperty({ description: 'Bank ID' })
  @IsInt()
  @IsNotEmpty()
  bankId: number;

  @ApiProperty({ description: 'Base salary' })
  @IsInt()
  @IsNotEmpty()
  salary: number;

  @ApiProperty({ description: 'Total salary' })
  @IsInt()
  @IsNotEmpty()
  salaryTotal: number;

  @ApiProperty({ description: 'Opening date', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  openingDate?: Date;

  @ApiProperty({ description: 'Account status' })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty({ description: 'Account plan ID', required: false })
  @IsOptional()
  @IsInt()
  accountPlanId?: number;
}
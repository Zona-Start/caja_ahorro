import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTransactionTypeDto {
  @ApiProperty({ description: 'Transaction type name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Transaction type description', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
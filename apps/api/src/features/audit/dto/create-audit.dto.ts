import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateAuditDto {
  @ApiProperty({ description: 'Name of the affected table' })
  @IsString()
  @IsNotEmpty()
  affectedTable: string;

  @ApiProperty({ description: 'Action performed (insert, update, delete)' })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiProperty({ description: 'ID of the affected record' })
  @IsNumber()
  recordId: number;

  @ApiProperty({ description: 'User who performed the action', required: false })
  @IsNumber()
  @IsOptional()
  userId?: number;

  @ApiProperty({ description: 'Additional details in JSON format', required: false })
  @IsObject()
  @IsOptional()
  details?: Record<string, any>;
}
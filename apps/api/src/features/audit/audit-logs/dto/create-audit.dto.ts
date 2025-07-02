import { ApiProperty } from '@nestjs/swagger';
import {  IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import { ActionEnumAudit } from '@/types/enum';

export class CreateAuditLogsDto {
  @ApiProperty({ description: 'Name of the affected table' })
  @IsString()
  @IsNotEmpty()
  tableName: string;

  @ApiProperty({ description: 'ID of the affected record' })
  @IsString()
  recordId: string;


  @ApiProperty({ description: 'Action performed (insert, update, delete)' })
  @IsEnum(ActionEnumAudit)
  action: ActionEnumAudit;

  @ApiProperty({ description: 'User who performed the action', required: false })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({ description: 'specify the responsible unit' })
  @IsString()
  @IsNotEmpty()
  area: string;

  @ApiProperty({ description: 'description log' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Additional details previos in JSON format', required: false })
  @IsObject()
  @IsOptional()
  previousData?: Record<string, any>;

  @ApiProperty({ description: 'Additional new details in JSON format', required: false })
  @IsObject()
  @IsOptional()
  newData?: Record<string, any>;
}
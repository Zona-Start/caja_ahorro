import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryTypeDto {
  @ApiProperty({
    description: 'The group of the category type',
    example: 'PAYROLL_TYPE',
  })
  @IsNotEmpty()
  @IsString()
  group: string;

  @ApiProperty({
    description: 'The description of the category type',
    example: 'Quincenal',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Additional options for the category type',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsArray()
  options?: any;
}

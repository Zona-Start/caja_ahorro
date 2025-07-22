import { StatusEnum } from '@/types/enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ description: 'Service name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Service description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Supplier ID' })
  @IsInt()
  @IsNotEmpty()
  suppliersId: number;

  @ApiProperty({ description: 'Default cost' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  defaultCost: number;

  @ApiPropertyOptional({ description: 'Status', enum: StatusEnum, default: StatusEnum.ACTIVE })
  @IsString()
  @IsOptional()
  status?: StatusEnum;
}

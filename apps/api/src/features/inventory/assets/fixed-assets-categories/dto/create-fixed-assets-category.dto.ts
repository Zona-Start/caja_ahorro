import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateFixedAssetCategoryDto {
  @ApiProperty({ example: 'Mobiliario' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Mobiliario de oficina' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 5 })
  @IsInt()
  @IsOptional()
  defaultUsefulLifeYears?: number;

  @ApiProperty({ example: 'Línea Recta' })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  defaultDepreciationMethod?: string;
}
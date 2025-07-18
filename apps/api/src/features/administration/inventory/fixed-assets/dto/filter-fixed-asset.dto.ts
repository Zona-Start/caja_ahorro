import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterFixedAssetDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  typeCategory?: number;

  @ApiPropertyOptional({ description: 'Asset status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Start acquisition date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End acquisition date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Brand' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ description: 'Model' })
  @IsOptional()
  @IsString()
  model?: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterServicePriceDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Service ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  serviceId?: number;

  @ApiPropertyOptional({ description: 'Supplier ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  suppliersId?: number;
}

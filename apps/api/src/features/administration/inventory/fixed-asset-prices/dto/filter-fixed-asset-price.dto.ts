import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterFixedAssetPriceDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Fixed Asset ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  fixedAssetsId?: number;

  @ApiPropertyOptional({ description: 'Supplier ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  suppliersId?: number;
}

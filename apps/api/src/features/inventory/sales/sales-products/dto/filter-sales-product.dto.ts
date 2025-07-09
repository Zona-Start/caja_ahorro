import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterSalesProductDto extends PartialType(PaginationDto) {
  @ApiPropertyOptional({ description: 'Column status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Column type' })
  @IsOptional()
  @IsInt()
  typeCategory?: number;
}

import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterAccountPlanDto extends PartialType(PaginationDto) {
  @ApiPropertyOptional({ description: 'Column type' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Column level' })
  @IsOptional()
  @IsString()
  level?: string;
}

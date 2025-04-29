import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterTypePayrollDto extends PartialType(PaginationDto) {
  @ApiPropertyOptional({ description: 'Column group' })
  @IsOptional()
  @IsString()
  group?: string;
}

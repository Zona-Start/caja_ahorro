import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterCreditPaidDto extends PartialType(PaginationDto) {
  @ApiPropertyOptional({ description: 'Column bank' })
  @IsOptional()
  @IsString()
  bank?: string;

  @ApiPropertyOptional({ description: 'Column type' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Column method' })
  @IsOptional()
  @IsString()
  method?: string;
}

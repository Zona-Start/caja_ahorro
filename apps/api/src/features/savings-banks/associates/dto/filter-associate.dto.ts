import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterAssociateDto extends PartialType(PaginationDto) {
  @ApiPropertyOptional({ description: 'Column status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Column payroll' })
  @IsOptional()
  @IsString()
  payroll?: string;
}

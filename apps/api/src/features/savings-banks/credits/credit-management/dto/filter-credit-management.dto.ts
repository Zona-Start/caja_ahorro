import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterCreditManagementDto extends PartialType(PaginationDto) {
  @ApiPropertyOptional({ description: 'Column status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Column type' })
  @IsOptional()
  @IsInt()
  type?: number;

  @ApiPropertyOptional({ description: 'Column modality' })
  @IsOptional()
  @IsString()
  modality?: string;
}

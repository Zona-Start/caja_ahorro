import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterWithdrawalAssociateDto extends PartialType(PaginationDto) {
  @ApiPropertyOptional({ description: 'Column type' })
  @IsOptional()
  @IsString()
  type?: string;
}

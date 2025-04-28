import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterBankAccountDto extends PartialType(PaginationDto) {
  @ApiPropertyOptional({ description: 'Column isActive' })
  @IsOptional()
  @IsString()
  isActive?: string;

  @ApiPropertyOptional({ description: 'Column currency code' })
  @IsOptional()
  @IsString()
  currencyCode?: string;

  @ApiPropertyOptional({ description: 'Column accountType' })
  @IsOptional()
  @IsString()
  accountType?: string;
}

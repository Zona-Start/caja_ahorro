import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterBankAccountDto extends PartialType(PaginationDto) {
  @ApiPropertyOptional({ description: 'Column isActive' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Column currency code' })
  @IsOptional()
  @IsString()
  currencyCode?: string;

  @ApiPropertyOptional({ description: 'Column accountType' })
  @IsOptional()
  @IsString()
  accountType?: string;
}

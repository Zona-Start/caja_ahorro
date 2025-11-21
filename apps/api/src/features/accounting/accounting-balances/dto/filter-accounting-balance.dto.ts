import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterAccountingBalanceDto extends PaginationDto {
  @IsOptional()
  @IsString()
  accountingCycleId?: string;

  @IsOptional()
  @IsString()
  companyId?: string;
}

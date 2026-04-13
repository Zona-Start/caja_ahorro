import { PaginationDto } from '@/common/dto/pagination.dto';
import { IsEnum, IsNumberString, IsOptional, IsString } from 'class-validator';

export class FilterBankReconciliationDto extends PaginationDto {
  @IsOptional()
  @IsNumberString()
  bankAccountId?: number;

  @IsOptional()
  @IsString()
  status?: string;
}

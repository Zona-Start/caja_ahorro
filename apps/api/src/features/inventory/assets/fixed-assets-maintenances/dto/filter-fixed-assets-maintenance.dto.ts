import { PaginationDto } from '@/common/dto/pagination.dto';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class FilterFixedAssetsMaintenanceDto extends PaginationDto {
  @IsOptional()
  @IsInt()
  assetId?: number;

  @IsOptional()
  @IsString()
  maintenanceType?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

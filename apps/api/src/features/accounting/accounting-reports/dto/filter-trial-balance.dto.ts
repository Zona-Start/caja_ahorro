import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class FilterTrialBalanceDto {
  @ApiPropertyOptional({ description: 'Accounting cycle ID' })
  @IsOptional()
  @IsString()
  accountingCycleId?: string;

  @ApiPropertyOptional({ description: 'Company ID' })
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiPropertyOptional({
    description: 'Account level filter (1, 2, 3, etc.)',
  })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiPropertyOptional({
    description: 'Show only accounts with movements',
    enum: ['true', 'false'],
  })
  @IsOptional()
  @IsEnum(['true', 'false'])
  onlyWithMovements?: string;
}

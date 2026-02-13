import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FilterBalanceSheetDto {
  @ApiPropertyOptional({ description: 'Accounting cycle ID' })
  @IsOptional()
  @IsString()
  accountingCycleId?: string;

  @ApiPropertyOptional({ description: 'Company ID' })
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiPropertyOptional({
    description: 'Detail level (1=summary, 2=detailed, 3=full)',
  })
  @IsOptional()
  @IsString()
  detailLevel?: string;
}

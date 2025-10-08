import { PaginationDto } from '@/common/dto/pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional } from 'class-validator';

export class QueryBankMovementDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'The ID of the bank account to filter movements.',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  bankAccountId?: number;

  @ApiPropertyOptional({
    description: 'Start date for filtering transactions.',
    example: '2024-07-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering transactions.',
    example: '2024-07-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

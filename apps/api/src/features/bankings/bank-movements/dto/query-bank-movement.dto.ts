import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryBankMovementDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    default: 1,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 10,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

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

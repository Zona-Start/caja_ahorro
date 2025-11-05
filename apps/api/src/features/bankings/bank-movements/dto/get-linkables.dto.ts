import { PaginationDto } from '@/common/dto/pagination.dto';
import { BankTransactionCategory } from '@/types/enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class GetLinkablesDto extends PaginationDto {
  @ApiProperty({
    description: 'bank category',
    enum: BankTransactionCategory,
  })
  @IsEnum(BankTransactionCategory)
  category: BankTransactionCategory;

  @ApiPropertyOptional({
    description: 'Start date for filtering linkable items.',
    example: '2024-07-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering linkable items.',
    example: '2024-07-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Search query for filtering',
    example: 'INV-001',
  })
  @IsOptional()
  @IsString()
  q?: string;
}

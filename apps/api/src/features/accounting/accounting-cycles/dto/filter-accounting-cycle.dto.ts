import { CycleStatusEnum } from '@/types/enum';
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsDate, IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterAccountingCycleDto extends PartialType(PaginationDto) {
  @ApiPropertyOptional({ description: 'Column start date' })
  @IsOptional()
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ description: 'Column end date' })
  @IsOptional()
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({
    description: 'Column status',
    enum: CycleStatusEnum,
    enumName: 'CycleStatusEnum',
  })
  @IsOptional()
  @IsEnum(CycleStatusEnum)
  status?: CycleStatusEnum;
}

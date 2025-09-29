import { entryStatusEnum } from '@/types/enum';
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterAccountingEntryDto extends PartialType(PaginationDto) {
  @ApiPropertyOptional({ description: 'Filtrar por ID de ciclo contable' })
  @IsOptional()
  @Type(() => Number)
  accountingCycleId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por estado del asiento',
    enum: entryStatusEnum,
  })
  @IsOptional()
  @IsEnum(entryStatusEnum)
  status?: entryStatusEnum;

  @ApiPropertyOptional({ description: 'Filtrar por tipo de origen' })
  @IsOptional()
  @IsString()
  originType?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de referencia de origen',
  })
  @IsOptional()
  @IsString()
  originReferenceId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por fecha de inicio del asiento',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'Filtrar por fecha de fin del asiento' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de cuenta contable en los detalles',
  })
  @IsOptional()
  @Type(() => Number)
  accountPlanId?: number;
}

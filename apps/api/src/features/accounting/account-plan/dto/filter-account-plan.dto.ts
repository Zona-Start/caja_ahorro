import { AccountTypeEnum } from '@/types/enum';
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterAccountPlanDto extends PartialType(PaginationDto) {
  @ApiPropertyOptional({
    description: 'Column type',
    enum: AccountTypeEnum,
    enumName: 'AccountTypeEnum',
  })
  @IsOptional()
  @IsEnum(AccountTypeEnum)
  type?: AccountTypeEnum;

  @ApiPropertyOptional({ description: 'Column level' })
  @IsOptional()
  @IsString()
  level?: string;
}

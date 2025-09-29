import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import { CreateAccountingEntryDto } from './create-accounting-entry.dto';
import { IsOptional, ValidateNested, ArrayMinSize, IsEnum, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateAccountingEntryDetailDto } from './update-accounting-entry-detail.dto';
import { CurrencyCodeEnum } from '@/types/enum';

export class UpdateAccountingEntryDto extends PartialType(
  OmitType(CreateAccountingEntryDto, ['details', 'entryDate']),
) {
  @ApiProperty({ type: () => [UpdateAccountingEntryDetailDto], description: 'Detalles del asiento contable', required: false })
  @IsOptional()
  @ArrayMinSize(2, { message: 'Un asiento contable debe tener al menos dos detalles (débito y crédito)' })
  @ValidateNested({ each: true })
  @Type(() => UpdateAccountingEntryDetailDto)
  details?: UpdateAccountingEntryDetailDto[];

  @ApiProperty({ description: 'Fecha contable del asiento', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  entryDate?: Date;
}
import { PartialType } from '@nestjs/swagger';
import { CreateAccountingEntryDetailDto } from './create-accounting-entry-detail.dto';
import { IsInt, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAccountingEntryDetailDto extends PartialType(CreateAccountingEntryDetailDto) {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  id?: number;
}
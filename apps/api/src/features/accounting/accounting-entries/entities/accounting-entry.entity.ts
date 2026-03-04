import { CurrencyCodeEnum, entryStatusEnum } from '@/types/enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { AccountingEntryDetail } from './accounting-entry-detail.entity';

export class AccountingEntry {
  @ApiProperty({ required: false })
  id?: number;

  @ApiProperty()
  companyId: number;

  @ApiProperty()
  accountingCycleId: number;

  @ApiProperty()
  entryDate: Date;

  @ApiProperty()
  description: string;

  @ApiProperty({ required: false })
  voucherNo?: string;

  @ApiProperty({ required: false })
  originReferenceId?: string;

  @ApiProperty({ required: false })
  originType?: string;

  @ApiProperty({ enum: entryStatusEnum })
  status: entryStatusEnum;

  @ApiProperty({ required: false })
  postedAt?: Date;

  @ApiProperty({ enum: CurrencyCodeEnum })
  currencyCode: CurrencyCodeEnum;

  @ApiProperty({ type: () => [AccountingEntryDetail], required: false })
  details?: AccountingEntryDetail[];

  @ApiProperty({ required: false })
  @IsOptional()
  createdAt?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  updatedAt?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  createdById?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  updatedById?: number;
}

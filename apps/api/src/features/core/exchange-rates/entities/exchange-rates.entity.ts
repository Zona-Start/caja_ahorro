import { CurrencyCodeEnum } from '@/types/enum';
import { ApiProperty } from '@nestjs/swagger';

export class ExchangeRates {
  @ApiProperty()
  id: number;

  @ApiProperty()
  date: Date;

  @ApiProperty({ type: () => CurrencyCodeEnum })
  fromCurrencyCode: CurrencyCodeEnum;

  @ApiProperty({ type: () => CurrencyCodeEnum })
  toCurrencyCode: CurrencyCodeEnum;

  @ApiProperty()
  rate: number;

  @ApiProperty()
  source: string;

  @ApiProperty({ required: false })
  createdAt?: Date;

  @ApiProperty({ required: false })
  updatedAt?: Date;

  @ApiProperty({ required: false })
  createdById?: number;

  @ApiProperty({ required: false })
  updateById?: number;
}

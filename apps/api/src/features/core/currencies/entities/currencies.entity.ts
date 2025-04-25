import { CurrencyCodeEnum } from '@/types/enum';
import { ApiProperty } from '@nestjs/swagger';

export class Currencies {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: CurrencyCodeEnum, enumName: 'CurrencyCodeEnum' })
  code: CurrencyCodeEnum;

  @ApiProperty()
  name: string;

  @ApiProperty()
  symbol: string;

  @ApiProperty()
  decimalPlaces: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ required: false })
  createdAt?: Date;

  @ApiProperty({ required: false })
  updatedAt?: Date;

  @ApiProperty({ required: false })
  createdById?: number;

  @ApiProperty({ required: false })
  updateById?: number;
}

import { CurrencyCodeEnum } from '@/types/enum';
import { ApiProperty } from '@nestjs/swagger';

export class BankAccounts {
  @ApiProperty()
  id: number;

  @ApiProperty()
  companyId: number;

  @ApiProperty()
  bankDirectoryId: number;

  @ApiProperty()
  accountNumber: string;

  @ApiProperty({ required: false })
  accountName?: string;

  @ApiProperty()
  accountType: string;

  @ApiProperty({ type: () => CurrencyCodeEnum })
  currencyCode: CurrencyCodeEnum;

  @ApiProperty({ required: false })
  openingDate?: Date;

  @ApiProperty({ required: false })
  currentBalance?: number;

  @ApiProperty({ required: false })
  lastStatementBalance?: number;

  @ApiProperty({ required: false })
  lastStatementDate?: Date;

  @ApiProperty()
  linkedChartAccountId: number;

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

import { CurrencyCodeEnum, StatusEnum } from '@/types/enum';
import { ApiProperty } from '@nestjs/swagger';

export class AssociateAccounts {
  @ApiProperty()
  id: number;

  @ApiProperty()
  associateId: number;

  @ApiProperty()
  accountNumber: string;

  @ApiProperty({ type: () => CurrencyCodeEnum })
  currencyCode: CurrencyCodeEnum;

  @ApiProperty()
  balance: number;

  @ApiProperty()
  openingDate: Date;

  @ApiProperty()
  bankDirectoryId: number;

  @ApiProperty()
  salary: number;

  @ApiProperty()
  salaryTotal: number;

  @ApiProperty()
  status: StatusEnum;

  @ApiProperty({ required: false })
  createdAt?: Date;

  @ApiProperty({ required: false })
  updatedAt?: Date;

  @ApiProperty({ required: false })
  createdById?: number;

  @ApiProperty({ required: false })
  updateById?: number;
}

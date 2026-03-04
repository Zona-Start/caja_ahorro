import { ApiProperty } from '@nestjs/swagger';

export class AccountingEntryDetail {
  @ApiProperty({ required: false })
  id?: number;

  @ApiProperty()
  accountingEntryId: number;

  @ApiProperty()
  accountPlanId: number;

  @ApiProperty({ type: 'string', format: 'float' })
  debit: string;

  @ApiProperty({ type: 'string', format: 'float' })
  credit: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  createdAt?: Date;

  @ApiProperty({ required: false })
  updatedAt?: Date;

  @ApiProperty({ required: false })
  account?: {
    code: string;
    name: string;
  };
}

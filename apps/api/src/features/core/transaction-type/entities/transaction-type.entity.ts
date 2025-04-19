import { ApiProperty } from '@nestjs/swagger';

export class TransactionType {
  @ApiProperty()
  id: number;

  @ApiProperty()
  code: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  deferredDate: Date;

  @ApiProperty()
  dateCanceled: Date;

  @ApiProperty({ required: false })
  deferredNumber?: number;

  @ApiProperty({ required: false })
  numberCanceled?: number;

  @ApiProperty({ required: false })
  associatedAccount?: number;

  @ApiProperty({ required: false })
  employerAccount?: number;

  @ApiProperty({ required: false })
  loanAccount?: number;

  @ApiProperty({ required: false })
  createdAt?: Date;

  @ApiProperty({ required: false })
  updatedAt?: Date;

  @ApiProperty({ required: false })
  createdById?: number;

  @ApiProperty({ required: false })
  updateById?: number;
}

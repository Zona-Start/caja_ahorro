import { ApiProperty } from '@nestjs/swagger';

export class AccountingConfiguration {
  @ApiProperty({ required: false })
  id?: number;

  @ApiProperty()
  companyId: number;

  @ApiProperty()
  operationType: string;

  @ApiProperty({ required: false })
  descriptionTemplate?: string;

  @ApiProperty({ required: false })
  debitAccountId?: number;

  @ApiProperty({ required: false })
  creditAccountId?: number;

  @ApiProperty({ required: false })
  contraAccountId?: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ required: false })
  createdAt?: Date;

  @ApiProperty({ required: false })
  updatedAt?: Date;

  @ApiProperty({ required: false })
  createdById?: number;

  @ApiProperty({ required: false })
  updatedById?: number;
}

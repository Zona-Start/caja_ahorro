import { AccountNatureEnum, AccountTypeEnum } from '@/types/enum';
import { ApiProperty } from '@nestjs/swagger';

export class AccountPlan {
  @ApiProperty({ required: false })
  id?: number;

  @ApiProperty({ required: false })
  companyId?: number | null;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string | null;

  @ApiProperty({ type: () => AccountTypeEnum })
  accountType: AccountTypeEnum;

  @ApiProperty({ type: () => AccountNatureEnum })
  nature: AccountNatureEnum;

  @ApiProperty()
  level: number;

  @ApiProperty()
  allowsMovements: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ required: false })
  parent_account_id?: number | null;

  @ApiProperty({ required: false })
  createdAt?: Date;

  @ApiProperty({ required: false })
  updatedAt?: Date;

  @ApiProperty({ required: false })
  createdById?: number;

  @ApiProperty({ required: false })
  updateById?: number;
}

import { CycleStatusEnum } from '@/types/enum';
import { ApiProperty } from '@nestjs/swagger';

export class AccountingCycle {
  @ApiProperty()
  id: number;

  @ApiProperty()
  companyId: number;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty({ type: () => CycleStatusEnum })
  status: CycleStatusEnum;

  @ApiProperty()
  description: string;

  @ApiProperty({ required: false })
  closedReason?: string;

  @ApiProperty({ required: false })
  closedByUser_id?: number;

  @ApiProperty({ required: false })
  closedAt?: Date;

  @ApiProperty({ required: false })
  createdAt?: Date;

  @ApiProperty({ required: false })
  updatedAt?: Date;

  @ApiProperty({ required: false })
  createdById?: number;

  @ApiProperty({ required: false })
  updateById?: number;
}

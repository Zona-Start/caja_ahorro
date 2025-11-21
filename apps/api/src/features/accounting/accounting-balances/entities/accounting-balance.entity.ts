
import { ApiProperty } from '@nestjs/swagger';

export class AccountBalance {
  @ApiProperty()
  id: number;

  @ApiProperty()
  companyId: number;

  @ApiProperty()
  accountPlanId: number;

  @ApiProperty()
  accountingCyclesId: number;

  @ApiProperty()
  initialBalance: string;

  @ApiProperty()
  debitBalance: string;

  @ApiProperty()
  creditBalance: string;

  @ApiProperty()
  finalBalance: string;
}

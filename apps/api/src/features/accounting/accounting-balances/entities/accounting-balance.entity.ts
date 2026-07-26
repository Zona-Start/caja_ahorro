import { ApiProperty } from '@nestjs/swagger';

export class AccountBalance {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  accountPlanId: string;

  @ApiProperty()
  accountingCyclesId: string;

  @ApiProperty()
  initialBalance: string;

  @ApiProperty()
  debitBalance: string;

  @ApiProperty()
  creditBalance: string;

  @ApiProperty()
  finalBalance: string;
}

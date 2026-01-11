import { ApiProperty } from '@nestjs/swagger';

export class AccountingRuleDetail {
  @ApiProperty({ required: false })
  id?: number;

  @ApiProperty({ required: false })
  ruleId?: number;

  @ApiProperty({
    description: 'Role of the account in the rule, e.g., ASOCIADO_CUENTA',
    required: false,
    nullable: true,
  })
  accountRole?: string | null;

  @ApiProperty({ enum: ['DEBIT', 'CREDIT'] })
  movementType: 'DEBIT' | 'CREDIT';

  @ApiProperty({
    required: false,
    description: 'Optional formula for calculation',
    nullable: true,
  })
  formula?: string | null;

  @ApiProperty({
    required: false,
    description: 'ID of the specific account if applicable',
    nullable: true,
  })
  accountPlanId?: number | null;
}

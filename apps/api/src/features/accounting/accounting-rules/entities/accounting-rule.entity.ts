import { ApiProperty } from '@nestjs/swagger';
import { AccountingRuleDetail } from './accounting-rule-detail.entity';

export class AccountingRule {
  @ApiProperty({ required: false })
  id?: number;

  @ApiProperty()
  companyId: number;

  @ApiProperty()
  operationType: string;

  @ApiProperty({ required: false, nullable: true })
  referenceId?: number | null;

  @ApiProperty({ required: false, nullable: true })
  description?: string | null;

  @ApiProperty({ required: false, default: true, nullable: true })
  isActive?: boolean | null;

  @ApiProperty({ type: () => [AccountingRuleDetail], required: false })
  details?: AccountingRuleDetail[];
}

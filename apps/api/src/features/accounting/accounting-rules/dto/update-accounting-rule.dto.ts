import { PartialType } from '@nestjs/swagger';
import { CreateAccountingRuleDto } from './create-accounting-rule.dto';

export class UpdateAccountingRuleDto extends PartialType(
  CreateAccountingRuleDto,
) {}

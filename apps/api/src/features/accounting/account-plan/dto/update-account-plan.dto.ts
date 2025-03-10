import { PartialType } from '@nestjs/swagger';
import { CreateAccountPlanDto } from './create-account-plan.dto';

export class UpdateAccountPlanDto extends PartialType(CreateAccountPlanDto) {}
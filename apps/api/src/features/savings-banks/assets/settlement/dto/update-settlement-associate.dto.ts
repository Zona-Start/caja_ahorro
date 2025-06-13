import { PartialType } from '@nestjs/swagger';
import { CreateSettlementAssociateDto } from './create-settlement-associate.dto';

export class UpdateSettlementAssociateDto extends PartialType(
  CreateSettlementAssociateDto,
) {}

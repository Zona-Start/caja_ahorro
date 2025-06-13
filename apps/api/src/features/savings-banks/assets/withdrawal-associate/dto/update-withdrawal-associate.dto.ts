import { PartialType } from '@nestjs/swagger';
import { CreateWithdrawalAssociateDto } from './create-withdrawal-associate.dto';

export class UpdateWithdrawalAssociateDto extends PartialType(
  CreateWithdrawalAssociateDto,
) {}

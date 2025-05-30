import { PartialType } from '@nestjs/swagger';
import { CreateAssociateWithdrawalTypeDto } from './create-associate-withdrawal-type.dto';

export class UpdateAssociateWithdrawalTypeDto extends PartialType(CreateAssociateWithdrawalTypeDto) {}

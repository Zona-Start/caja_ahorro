import { PartialType } from '@nestjs/swagger';
import { CreateAssociateAccountsMovementDto } from './create-associate-accounts-movement.dto';

export class UpdateAssociateAccountsMovementDto extends PartialType(CreateAssociateAccountsMovementDto) {}

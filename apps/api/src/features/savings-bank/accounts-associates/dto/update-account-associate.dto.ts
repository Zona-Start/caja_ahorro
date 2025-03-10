import { PartialType } from '@nestjs/swagger';
import { CreateAccountAssociateDto } from './create-account-associate.dto';

export class UpdateAccountAssociateDto extends PartialType(CreateAccountAssociateDto) {}
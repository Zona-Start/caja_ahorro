import { PartialType } from '@nestjs/swagger';
import { CreateWithdrawalTypeDto } from './create-withdrawal-type.dto';

export class UpdateWithdrawalTypeDto extends PartialType(CreateWithdrawalTypeDto) {}

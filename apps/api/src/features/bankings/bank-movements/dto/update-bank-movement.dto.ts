import { PartialType } from '@nestjs/swagger';
import { CreateBankMovementDto } from './create-bank-movement.dto';

export class UpdateBankMovementDto extends PartialType(CreateBankMovementDto) {}

import { PartialType } from '@nestjs/swagger';
import { CreateMovementCountableDto } from './create-movement-countable.dto';

export class UpdateMovementCountableDto extends PartialType(CreateMovementCountableDto) {}
import { PartialType } from '@nestjs/swagger'; // Or @nestjs/mapped-types
import { CreateCreditTypeDto } from './create-credit-type.dto';

export class UpdateCreditTypeDto extends PartialType(CreateCreditTypeDto) {}

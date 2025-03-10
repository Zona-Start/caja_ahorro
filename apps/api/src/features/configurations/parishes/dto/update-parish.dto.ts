import { PartialType } from '@nestjs/swagger';
import { CreateParishDto } from './create-parish.dto';

export class UpdateParishDto extends PartialType(CreateParishDto) {}
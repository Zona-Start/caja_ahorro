import { PartialType } from '@nestjs/swagger';
import { CreateTypeOperationsDto } from './create-type-operations.dto';

export class UpdateTypeOperationsDto extends PartialType(
  CreateTypeOperationsDto,
) {}

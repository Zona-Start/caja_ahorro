import { PartialType } from '@nestjs/swagger';
import { CreateInventoryCategoryDto } from './create-inventories-category.dto';

export class UpdateInventoryCategoryDto extends PartialType(
  CreateInventoryCategoryDto,
) {}

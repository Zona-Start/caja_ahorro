import { PartialType } from '@nestjs/swagger';
import { CreateFixedAssetCategoryDto } from './create-fixed-assets-category.dto';

export class UpdateFixedAssetsCategoryDto extends PartialType(
  CreateFixedAssetCategoryDto,
) {}

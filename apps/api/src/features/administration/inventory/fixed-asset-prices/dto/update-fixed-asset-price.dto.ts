import { PartialType } from '@nestjs/swagger';
import { CreateFixedAssetPriceDto } from './create-fixed-asset-price.dto';

export class UpdateFixedAssetPriceDto extends PartialType(
  CreateFixedAssetPriceDto,
) {}

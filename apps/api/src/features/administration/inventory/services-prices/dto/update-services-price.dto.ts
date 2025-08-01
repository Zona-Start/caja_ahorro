import { PartialType } from '@nestjs/swagger';
import { CreateServicePriceDto } from './create-services-price.dto';

export class UpdateServicePriceDto extends PartialType(CreateServicePriceDto) {}

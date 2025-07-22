import { PartialType } from '@nestjs/swagger';
import { CreateProductServiceSupplierDto } from './create-product-service-supplier.dto';

export class UpdateProductServiceSupplierDto extends PartialType(
  CreateProductServiceSupplierDto,
) {}

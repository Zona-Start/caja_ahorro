import { PartialType } from '@nestjs/swagger';
import { CreateSalesProductPurchaseDto } from './create-sales-product-purchase.dto';

export class UpdateSalesProductPurchaseDto extends PartialType(CreateSalesProductPurchaseDto) {}

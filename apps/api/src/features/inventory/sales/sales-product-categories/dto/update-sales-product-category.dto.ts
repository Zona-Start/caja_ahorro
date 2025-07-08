import { PartialType } from '@nestjs/swagger';
import { CreateSalesProductCategoryDto } from './create-sales-product-category.dto';

export class UpdateSalesProductCategoryDto extends PartialType(CreateSalesProductCategoryDto) {}

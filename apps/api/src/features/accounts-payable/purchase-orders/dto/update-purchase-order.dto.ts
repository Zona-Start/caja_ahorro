import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { CreatePurchaseOrderDto } from './create-purchase-order.dto';
import { UpdatePurchaseItemDto } from './update-purchase-item.dto';
import { CreatePurchaseItemDto } from './create-purchase-item.dto';

export class UpdatePurchaseOrderDto extends PartialType(
  CreatePurchaseOrderDto,
) {
  @ApiProperty({
    type: () => [UpdatePurchaseItemDto],
    description: 'Lista de ítems de la orden de compra',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePurchaseItemDto)
  items?: CreatePurchaseItemDto[];
}

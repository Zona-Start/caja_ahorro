import { purchaseItemTypeEnum } from '@/types/enum';
import { ApiProperty } from '@nestjs/swagger';

export class PurchaseItem {
  @ApiProperty({ required: false })
  id?: number;

  @ApiProperty()
  purchaseOrderId: number;

  @ApiProperty({ enum: purchaseItemTypeEnum, enumName: 'PurchaseItemTypeEnum' })
  itemType: purchaseItemTypeEnum;

  @ApiProperty()
  itemName: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitCost: number;

  @ApiProperty()
  totalCost: number;

  @ApiProperty({ required: false })
  salesProductId?: number;

  @ApiProperty({ required: false })
  fixedAssetId?: number;

  @ApiProperty({ required: false })
  createdAt?: Date;

  @ApiProperty({ required: false })
  updatedAt?: Date;

  @ApiProperty({ required: false })
  createdById?: number;

  @ApiProperty({ required: false })
  updatedById?: number;
}
